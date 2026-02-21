// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAgentRegistry.sol";
import "./interfaces/IDEXAggregator.sol";

/**
 * @title TradeExecutor
 * @dev Executes trades for registered agents via DEX aggregator
 */
contract TradeExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IAgentRegistry public immutable agentRegistry;
    IDEXAggregator public dexAggregator;
    
    // Trading parameters
    uint256 public constant MAX_SLIPPAGE = 1000; // 10% max slippage
    uint256 public constant SLIPPAGE_DENOMINATOR = 10000;
    
    struct TradeSignal {
        uint256 agentId;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
        bytes signalData; // Encoded signal from AI
        bytes signature; // Signature for validation
    }
    
    struct TradeExecution {
        uint256 agentId;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 executedAt;
        bytes32 txHash;
    }
    
    // Mappings
    mapping(uint256 => TradeExecution[]) public agentTrades;
    mapping(bytes32 => bool) public executedSignals;
    
    // Events
    event TradeExecuted(
        uint256 indexed agentId,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 executedAt
    );
    
    event SignalValidated(
        uint256 indexed agentId,
        bytes32 indexed signalHash,
        bool isValid
    );
    
    constructor(address _agentRegistry, address _dexAggregator) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
        dexAggregator = IDEXAggregator(_dexAggregator);
    }
    
    /**
     * @dev Execute a trade based on AI signal
     * @param _signal Trade signal parameters
     */
    function executeTrade(TradeSignal calldata _signal) 
        external 
        nonReentrant 
        onlyValidAgent(_signal.agentId)
    {
        // Validate signal hasn't been executed
        bytes32 signalHash = keccak256(abi.encode(_signal));
        require(!executedSignals[signalHash], "Signal already executed");
        
        // Validate signal signature and parameters
        require(_validateSignal(_signal), "Invalid signal");
        
        // Check agent status is active
        IAgentRegistry.Agent memory agent = agentRegistry.getAgent(_signal.agentId);
        require(agent.status == IAgentRegistry.AgentStatus.Active, "Agent not active");
        
        // Execute the swap via DEX aggregator
        uint256 amountOut = _executeSwap(_signal);
        
        // Record the trade
        TradeExecution memory execution = TradeExecution({
            agentId: _signal.agentId,
            tokenIn: _signal.tokenIn,
            tokenOut: _signal.tokenOut,
            amountIn: _signal.amountIn,
            amountOut: amountOut,
            executedAt: block.timestamp,
            txHash: blockhash(block.number - 1)
        });
        
        agentTrades[_signal.agentId].push(execution);
        executedSignals[signalHash] = true;
        
        emit TradeExecuted(
            _signal.agentId,
            _signal.tokenIn,
            _signal.tokenOut,
            _signal.amountIn,
            amountOut,
            block.timestamp
        );
    }
    
    /**
     * @dev Validate trading signal
     * @param _signal Trade signal to validate
     */
    function _validateSignal(TradeSignal calldata _signal) internal view returns (bool) {
        // Check deadline
        if (block.timestamp > _signal.deadline) {
            return false;
        }
        
        // Validate slippage protection
        uint256 expectedAmountOut = _getExpectedAmountOut(_signal.tokenIn, _signal.tokenOut, _signal.amountIn);
        uint256 maxSlippage = (expectedAmountOut * MAX_SLIPPAGE) / SLIPPAGE_DENOMINATOR;
        
        if (expectedAmountOut - _signal.minAmountOut > maxSlippage) {
            return false;
        }
        
        // Additional signal validation logic would go here
        // (signature verification, AI signal validation, etc.)
        
        return true;
    }
    
    /**
     * @dev Execute swap via DEX aggregator
     * @param _signal Trade signal parameters
     */
    function _executeSwap(TradeSignal calldata _signal) internal returns (uint256) {
        // Transfer tokens from agent owner
        IAgentRegistry.Agent memory agent = agentRegistry.getAgent(_signal.agentId);
        address owner = agent.owner;
        IERC20(_signal.tokenIn).safeTransferFrom(owner, address(this), _signal.amountIn);
        
        // Approve DEX aggregator
        IERC20(_signal.tokenIn).approve(address(dexAggregator), _signal.amountIn);
        
        // Execute swap
        uint256 amountOut = dexAggregator.swap(
            _signal.tokenIn,
            _signal.tokenOut,
            _signal.amountIn,
            _signal.minAmountOut,
            owner // Send output tokens back to agent owner
        );
        
        return amountOut;
    }
    
    /**
     * @dev Get expected amount out for a swap
     * @param _tokenIn Input token address
     * @param _tokenOut Output token address
     * @param _amountIn Input amount
     */
    function _getExpectedAmountOut(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) internal view returns (uint256) {
        return dexAggregator.getAmountOut(_tokenIn, _tokenOut, _amountIn);
    }
    
    /**
     * @dev Get trade history for an agent
     * @param _agentId Agent ID
     */
    function getAgentTrades(uint256 _agentId) external view returns (TradeExecution[] memory) {
        return agentTrades[_agentId];
    }
    
    /**
     * @dev Update DEX aggregator address
     * @param _newAggregator New aggregator address
     */
    function updateDEXAggregator(address _newAggregator) external onlyOwner {
        dexAggregator = IDEXAggregator(_newAggregator);
    }
    
    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
    }
    
    modifier onlyValidAgent(uint256 _agentId) {
        require(_agentId > 0 && _agentId <= agentRegistry.getTotalAgents(), "Invalid agent ID");
        _;
    }
}