// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDEXAggregator {
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut);
    
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut);
}