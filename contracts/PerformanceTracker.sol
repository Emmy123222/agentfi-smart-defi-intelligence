// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAgentRegistry.sol";

/**
 * @title PerformanceTracker
 * @dev Tracks on-chain P&L and performance metrics for trading agents
 */
contract PerformanceTracker is Ownable {
    
    IAgentRegistry public immutable agentRegistry;
    
    struct PerformanceMetrics {
        uint256 totalTrades;
        uint256 successfulTrades;
        uint256 totalVolume;
        int256 totalPnL;
        uint256 lastUpdated;
        uint256 maxDrawdown;
        uint256 sharpeRatio; // Scaled by 10000
    }
    
    struct TradeRecord {
        uint256 timestamp;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        int256 pnl;
        bool isProfit;
    }
    
    // Mappings
    mapping(uint256 => PerformanceMetrics) public agentPerformance;
    mapping(uint256 => TradeRecord[]) public agentTradeHistory;
    mapping(uint256 => mapping(uint256 => uint256)) public dailyPnL; // agentId => day => pnl
    
    // Events
    event TradeRecorded(
        uint256 indexed agentId,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        int256 pnl
    );
    
    event PerformanceUpdated(
        uint256 indexed agentId,
        uint256 totalTrades,
        int256 totalPnL,
        uint256 successRate
    );
    
    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
    }
    
    /**
     * @dev Record a trade execution and update performance metrics
     * @param _agentId Agent ID
     * @param _tokenIn Input token address
     * @param _tokenOut Output token address
     * @param _amountIn Input amount
     * @param _amountOut Output amount received
     * @param _expectedAmountOut Expected output amount
     */
    function recordTrade(
        uint256 _agentId,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOut,
        uint256 _expectedAmountOut
    ) external onlyAuthorized {
        // Calculate P&L (simplified - in production would need price oracles)
        int256 pnl = int256(_amountOut) - int256(_expectedAmountOut);
        bool isProfit = pnl > 0;
        
        // Create trade record
        TradeRecord memory trade = TradeRecord({
            timestamp: block.timestamp,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: _amountOut,
            pnl: pnl,
            isProfit: isProfit
        });
        
        agentTradeHistory[_agentId].push(trade);
        
        // Update performance metrics
        PerformanceMetrics storage metrics = agentPerformance[_agentId];
        metrics.totalTrades++;
        if (isProfit) {
            metrics.successfulTrades++;
        }
        metrics.totalVolume += _amountIn;
        metrics.totalPnL += pnl;
        metrics.lastUpdated = block.timestamp;
        
        // Update daily P&L
        uint256 day = block.timestamp / 86400; // Days since epoch
        dailyPnL[_agentId][day] += uint256(pnl > 0 ? pnl : -pnl);
        
        // Calculate and update advanced metrics
        _updateAdvancedMetrics(_agentId);
        
        emit TradeRecorded(_agentId, _tokenIn, _tokenOut, _amountIn, _amountOut, pnl);
        emit PerformanceUpdated(
            _agentId,
            metrics.totalTrades,
            metrics.totalPnL,
            _calculateSuccessRate(_agentId)
        );
    }
    
    /**
     * @dev Get performance metrics for an agent
     * @param _agentId Agent ID
     */
    function getPerformanceMetrics(uint256 _agentId) 
        external 
        view 
        returns (PerformanceMetrics memory) 
    {
        return agentPerformance[_agentId];
    }
    
    /**
     * @dev Get trade history for an agent
     * @param _agentId Agent ID
     * @param _limit Maximum number of trades to return
     */
    function getTradeHistory(uint256 _agentId, uint256 _limit) 
        external 
        view 
        returns (TradeRecord[] memory) 
    {
        TradeRecord[] storage trades = agentTradeHistory[_agentId];
        uint256 length = trades.length;
        
        if (_limit == 0 || _limit > length) {
            _limit = length;
        }
        
        TradeRecord[] memory result = new TradeRecord[](_limit);
        for (uint256 i = 0; i < _limit; i++) {
            result[i] = trades[length - 1 - i]; // Return most recent first
        }
        
        return result;
    }
    
    /**
     * @dev Calculate success rate for an agent
     * @param _agentId Agent ID
     */
    function _calculateSuccessRate(uint256 _agentId) internal view returns (uint256) {
        PerformanceMetrics storage metrics = agentPerformance[_agentId];
        if (metrics.totalTrades == 0) return 0;
        
        return (metrics.successfulTrades * 10000) / metrics.totalTrades; // Scaled by 10000
    }
    
    /**
     * @dev Update advanced performance metrics
     * @param _agentId Agent ID
     */
    function _updateAdvancedMetrics(uint256 _agentId) internal {
        PerformanceMetrics storage metrics = agentPerformance[_agentId];
        TradeRecord[] storage trades = agentTradeHistory[_agentId];
        
        if (trades.length < 2) return;
        
        // Calculate max drawdown
        int256 peak = 0;
        int256 currentPnL = 0;
        uint256 maxDrawdown = 0;
        
        for (uint256 i = 0; i < trades.length; i++) {
            currentPnL += trades[i].pnl;
            if (currentPnL > peak) {
                peak = currentPnL;
            }
            
            int256 drawdown = peak - currentPnL;
            if (drawdown > 0 && uint256(drawdown) > maxDrawdown) {
                maxDrawdown = uint256(drawdown);
            }
        }
        
        metrics.maxDrawdown = maxDrawdown;
        
        // Calculate Sharpe ratio (simplified)
        metrics.sharpeRatio = _calculateSharpeRatio(_agentId);
    }
    
    /**
     * @dev Calculate Sharpe ratio for an agent
     * @param _agentId Agent ID
     */
    function _calculateSharpeRatio(uint256 _agentId) internal view returns (uint256) {
        TradeRecord[] storage trades = agentTradeHistory[_agentId];
        if (trades.length < 10) return 0; // Need minimum trades for meaningful calculation
        
        // Calculate average return and standard deviation
        int256 totalReturn = 0;
        for (uint256 i = 0; i < trades.length; i++) {
            totalReturn += trades[i].pnl;
        }
        
        int256 avgReturn = totalReturn / int256(trades.length);
        
        // Calculate standard deviation
        uint256 variance = 0;
        for (uint256 i = 0; i < trades.length; i++) {
            int256 diff = trades[i].pnl - avgReturn;
            variance += uint256(diff * diff);
        }
        variance = variance / trades.length;
        
        uint256 stdDev = _sqrt(variance);
        
        // Sharpe ratio = (average return - risk free rate) / standard deviation
        // Assuming risk-free rate is 0 for simplicity
        if (stdDev == 0) return 0;
        
        return uint256(avgReturn > 0 ? avgReturn : -avgReturn) * 10000 / stdDev;
    }
    
    /**
     * @dev Calculate square root using Babylonian method
     * @param _x Input value
     */
    function _sqrt(uint256 _x) internal pure returns (uint256) {
        if (_x == 0) return 0;
        
        uint256 z = (_x + 1) / 2;
        uint256 y = _x;
        
        while (z < y) {
            y = z;
            z = (_x / z + z) / 2;
        }
        
        return y;
    }
    
    /**
     * @dev Get daily P&L for an agent
     * @param _agentId Agent ID
     * @param _day Day (days since epoch)
     */
    function getDailyPnL(uint256 _agentId, uint256 _day) external view returns (uint256) {
        return dailyPnL[_agentId][_day];
    }
    
    /**
     * @dev Get P&L for a date range
     * @param _agentId Agent ID
     * @param _startDay Start day
     * @param _endDay End day
     */
    function getPnLRange(uint256 _agentId, uint256 _startDay, uint256 _endDay) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(_endDay >= _startDay, "Invalid date range");
        
        uint256 length = _endDay - _startDay + 1;
        uint256[] memory pnlData = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            pnlData[i] = dailyPnL[_agentId][_startDay + i];
        }
        
        return pnlData;
    }
    
    modifier onlyAuthorized() {
        // In production, this would check if caller is authorized (TradeExecutor contract)
        _;
    }
}