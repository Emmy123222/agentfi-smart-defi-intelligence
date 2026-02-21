// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    enum AgentStatus { Created, Active, Paused, Stopped }
    enum Strategy { TrendFollowing, Momentum, MeanReversion }
    enum RiskLevel { Low, Medium, High }
    
    struct Agent {
        uint256 id;
        address owner;
        string name;
        Strategy strategy;
        RiskLevel riskLevel;
        uint256 allocatedAmount;
        AgentStatus status;
        bytes32 configHash;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    function registerAgent(
        string memory _name,
        Strategy _strategy,
        RiskLevel _riskLevel,
        uint256 _allocatedAmount,
        bytes32 _configHash
    ) external returns (uint256);
    
    function updateAgentStatus(uint256 _agentId, AgentStatus _newStatus) external;
    function getAgent(uint256 _agentId) external view returns (Agent memory);
    function getAgentsByOwner(address _owner) external view returns (uint256[] memory);
    function getTotalAgents() external view returns (uint256);
}