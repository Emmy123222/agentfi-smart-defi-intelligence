// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @dev Registry for AI trading agents with configuration storage and ownership tracking
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    
    uint256 private _agentIds;
    
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
        bytes32 configHash; // Hash of off-chain configuration
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Mappings
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;
    mapping(bytes32 => bool) public configHashes;
    
    // Events
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        Strategy strategy,
        RiskLevel riskLevel,
        uint256 allocatedAmount
    );
    
    event AgentStatusUpdated(
        uint256 indexed agentId,
        AgentStatus oldStatus,
        AgentStatus newStatus
    );
    
    event AgentConfigUpdated(
        uint256 indexed agentId,
        bytes32 oldConfigHash,
        bytes32 newConfigHash
    );
    
    constructor() Ownable(msg.sender) {
        _agentIds = 0;
    }
    
    /**
     * @dev Register a new trading agent
     * @param _name Agent name
     * @param _strategy Trading strategy
     * @param _riskLevel Risk level
     * @param _allocatedAmount Amount allocated to agent
     * @param _configHash Hash of agent configuration
     */
    function registerAgent(
        string memory _name,
        Strategy _strategy,
        RiskLevel _riskLevel,
        uint256 _allocatedAmount,
        bytes32 _configHash
    ) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Agent name cannot be empty");
        require(_allocatedAmount > 0, "Allocated amount must be greater than 0");
        require(!configHashes[_configHash], "Configuration hash already exists");
        
        _agentIds++;
        uint256 newAgentId = _agentIds;
        
        Agent memory newAgent = Agent({
            id: newAgentId,
            owner: msg.sender,
            name: _name,
            strategy: _strategy,
            riskLevel: _riskLevel,
            allocatedAmount: _allocatedAmount,
            status: AgentStatus.Created,
            configHash: _configHash,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        agents[newAgentId] = newAgent;
        ownerAgents[msg.sender].push(newAgentId);
        configHashes[_configHash] = true;
        
        emit AgentRegistered(
            newAgentId,
            msg.sender,
            _name,
            _strategy,
            _riskLevel,
            _allocatedAmount
        );
        
        return newAgentId;
    }
    
    /**
     * @dev Update agent status
     * @param _agentId Agent ID
     * @param _newStatus New status
     */
    function updateAgentStatus(uint256 _agentId, AgentStatus _newStatus) 
        external 
        onlyAgentOwner(_agentId) 
    {
        Agent storage agent = agents[_agentId];
        AgentStatus oldStatus = agent.status;
        
        agent.status = _newStatus;
        agent.updatedAt = block.timestamp;
        
        emit AgentStatusUpdated(_agentId, oldStatus, _newStatus);
    }
    
    /**
     * @dev Update agent configuration
     * @param _agentId Agent ID
     * @param _newConfigHash New configuration hash
     */
    function updateAgentConfig(uint256 _agentId, bytes32 _newConfigHash)
        external
        onlyAgentOwner(_agentId)
    {
        require(!configHashes[_newConfigHash], "Configuration hash already exists");
        
        Agent storage agent = agents[_agentId];
        bytes32 oldConfigHash = agent.configHash;
        
        // Remove old hash and add new one
        configHashes[oldConfigHash] = false;
        configHashes[_newConfigHash] = true;
        
        agent.configHash = _newConfigHash;
        agent.updatedAt = block.timestamp;
        
        emit AgentConfigUpdated(_agentId, oldConfigHash, _newConfigHash);
    }
    
    /**
     * @dev Get agent details
     * @param _agentId Agent ID
     */
    function getAgent(uint256 _agentId) external view returns (Agent memory) {
        require(_agentId <= _agentIds, "Agent does not exist");
        return agents[_agentId];
    }
    
    /**
     * @dev Get agents owned by an address
     * @param _owner Owner address
     */
    function getAgentsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerAgents[_owner];
    }
    
    /**
     * @dev Get total number of agents
     */
    function getTotalAgents() external view returns (uint256) {
        return _agentIds;
    }
    
    /**
     * @dev Check if caller owns the agent
     */
    modifier onlyAgentOwner(uint256 _agentId) {
        require(agents[_agentId].owner == msg.sender, "Not agent owner");
        _;
    }
}