import React from 'react';
import PropTypes from 'prop-types';
import Nav from 'react-bootstrap/Nav';

// The container defining the structure of the dashboard
export default class Container extends React.Component {
    render() {
        const items = ["Home", "Register", "Login"];
        return (
            <div className="container-fluid">
                <div className="row">
                    <SideMenu items={items}/>
                    
                </div>
            </div>
        );
    }
}

class Icon extends React.Component {
    render() {
        return (
            <img src={"http://s.cdpn.io/3/kiwi.svg"} width="12px" height="12px"/>
        );
    }
}

const SideMenu = (props) => {
    const menuItems = props.items.map((item, idx) => {
        return ( 
            <Nav.Item key={idx}>
                <Icon />
                <Nav.Link className="pos-center" eventKey={"item" + idx} href={"/" + item}>{item}</Nav.Link>
            </Nav.Item>
        );
    })
    return (
    <div className="col-md-2 col-lg-2 d-none d-md-block bg-light">
        <Nav defaultActiveKey="/" className="flex-column">
            {menuItems}
        </Nav>
    </div>
    );
}

SideMenu.propTypes = {
    items: PropTypes.array
}