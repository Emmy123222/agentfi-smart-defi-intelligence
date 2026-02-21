// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IDEXAggregator.sol";

/**
 * @title MockDEXAggregator
 * @dev Mock DEX aggregator for testing purposes
 */
contract MockDEXAggregator is IDEXAggregator {
    using SafeERC20 for IERC20;
    
    // Mock exchange rate: 1 token = 1 USDC (simplified)
    uint256 public constant MOCK_RATE = 1e18;
    
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );
    
    /**
     * @dev Execute a mock swap
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external override returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient");
        
        // Calculate mock output amount (1:1 ratio for simplicity)
        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        // Transfer tokens from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to recipient
        // Note: In a real implementation, this would interact with actual DEXs
        // For testing, we assume this contract has sufficient token balances
        IERC20(tokenOut).safeTransfer(to, amountOut);
        
        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, to);
    }
    
    /**
     * @dev Get expected output amount for a swap
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public pure override returns (uint256 amountOut) {
        // Mock calculation - in reality this would query actual DEX prices
        // For testing, we use a simple 1:1 ratio with 0.3% fee
        amountOut = (amountIn * 997) / 1000; // 0.3% fee
    }
    
    /**
     * @dev Emergency function to withdraw tokens (owner only in production)
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
    
    /**
     * @dev Get contract token balance
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}