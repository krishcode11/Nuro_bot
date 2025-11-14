// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableToken
 * @dev Test contract with multiple vulnerabilities for Slither testing
 * This contract intentionally contains security issues for testing purposes
 */
contract VulnerableToken {
    string public name = "Vulnerable Token";
    string public symbol = "VUL";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Vulnerability 1: Uninitialized state variable
    bool public paused;
    
    // Vulnerability 2: Missing event emissions
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
    }
    
    // Vulnerability 3: No access control modifier
    function mint(address _to, uint256 _amount) public {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
    }
    
    // Vulnerability 4: Reentrancy risk
    function withdraw(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        
        // External call before state update (reentrancy)
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        balanceOf[msg.sender] -= _amount;
    }
    
    // Vulnerability 5: Unchecked return value
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        // Missing event emission
        return true;
    }
    
    // Vulnerability 6: Integer overflow (pre-0.8.0 style)
    function unsafeAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // Could overflow in older versions
    }
    
    // Vulnerability 7: Weak randomness
    function random() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender)));
    }
    
    // Vulnerability 8: Timestamp dependence
    function isLotteryTime() public view returns (bool) {
        return block.timestamp % 2 == 0;
    }
    
    // Vulnerability 9: Unprotected self-destruct
    function destroy() public {
        selfdestruct(payable(owner));
    }
    
    // Vulnerability 10: Deprecated functions
    function oldStyleCall(address _target) public {
        _target.call("");
    }
    
    receive() external payable {}
}

/**
 * @title BetterToken
 * @dev A more secure token implementation with some best practices
 */
contract BetterToken {
    string public name = "Better Token";
    string public symbol = "BTR";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    bool public paused;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Paused(address account);
    event Unpaused(address account);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
        paused = false;
    }
    
    function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "Invalid spender");
        
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Invalid address");
        
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        
        emit Transfer(address(0), _to, _amount);
    }
    
    function burn(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        
        emit Transfer(msg.sender, address(0), _amount);
    }
    
    function pause() public onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}

/**
 * @title ReentrancyVulnerable
 * @dev Contract specifically for testing reentrancy detection
 */
contract ReentrancyVulnerable {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // Classic reentrancy vulnerability
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // Vulnerable: external call before state update
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= _amount;
    }
    
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}

/**
 * @title AccessControlIssues
 * @dev Contract with access control vulnerabilities
 */
contract AccessControlIssues {
    address public owner;
    uint256 public secretNumber;
    
    constructor() {
        owner = msg.sender;
        secretNumber = 12345;
    }
    
    // Vulnerability: Anyone can call this
    function changeOwner(address newOwner) public {
        owner = newOwner;
    }
    
    // Vulnerability: tx.origin authentication
    function withdrawAll() public {
        require(tx.origin == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    // Private but still visible on blockchain
    function getSecret() private view returns (uint256) {
        return secretNumber;
    }
    
    receive() external payable {}
}

/**
 * @title UncheckedCalls
 * @dev Contract with unchecked low-level calls
 */
contract UncheckedCalls {
    address public recipient;
    
    constructor(address _recipient) {
        recipient = _recipient;
    }
    
    // Vulnerability: Unchecked call
    function sendEther(uint256 amount) public {
        recipient.call{value: amount}("");
    }
    
    // Vulnerability: Unchecked delegatecall
    function delegateCallToAddress(address target, bytes memory data) public {
        target.delegatecall(data);
    }
    
    receive() external payable {}
}
