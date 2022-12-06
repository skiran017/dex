// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;

    mapping(address => mapping(address => uint256)) public tokens;

    //Orders mapping
    mapping(uint256 => _Order) public orders;
    uint256 public orderCount;
    mapping(uint256 => bool) public orderCancelled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timeStamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timeStamp
    );

    //A way to model the order
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timeStamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //Deposit Tokens
    function depositToken(address _token, uint256 _amount) public {
        //Transfer tokens to exchange smart contract
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        //update user balance(add)
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

        //emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Withdraw Tokens
    function withdrawToken(address _token, uint256 _amount) public {
        //Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);

        //Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);

        //Update user balance(subtract)
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        //Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Check Balance
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    //Make Orders
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        //Require token balance
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        //Create order
        orderCount = orderCount + 1;
        orders[orderCount] = _Order(
            orderCount, // order id
            msg.sender, // user '0x0..ab23'
            _tokenGet, // token user gets
            _amountGet, // amount user gets
            _tokenGive, // token user gives
            _amountGive, // amount user gives
            block.timestamp // time when order was created
        );

        //Emit event
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    //Cancel Order
    function cancelOrder(uint256 _id) public {
        //Fetch order
        _Order storage _order = orders[_id];

        //Ensure the caller of the function is the owner of the order
        require(address(_order.user) == msg.sender);

        //Order must exist
        require(_order.id == _id);

        //Cancel the order
        orderCancelled[_id] = true;

        //Emit event
        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }
}
