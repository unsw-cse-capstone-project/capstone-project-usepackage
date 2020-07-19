import React from 'react';
import PropTypes from 'prop-types';
import Nav from 'react-bootstrap/Nav';
import { Link, withRouter} from 'react-router-dom';

// The container defining the structure of the dashboard
export default class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            navItems: ["Home", "Register", "Login"],
            loggedInItems: ["Home", "Profile", "Logout"]
        }
    }

    render() {
        return localStorage.usertoken 
        ? (
            <div className="container-fluid">
                <div className="row">
                    <SideMenu items={this.state.loggedInItems}/>
                    {this.props.main}
                </div>
            </div>
        )
        : (
            <div className="container-fluid">
                <div className="row">
                    <SideMenu items={this.state.navItems}/>
                    {this.props.main}
                </div>
            </div>
        )
    }
}

const SideMenu = (props) => {
    const menuItems = props.items.map((item, idx) => {
        const logout = () => {
            localStorage.removeItem('usertoken');
            const a = document.createElement('a');
            a.href = "/";
            a.hidden = true;
            document.body.appendChild(a);
            a.click();
        }
        return item !== "Logout"
        ? ( 
            <Nav.Item key={idx}>
                <Nav.Link className="pos-center" eventKey={"item" + idx} href={"/" + item.toLowerCase()}>{item}</Nav.Link>
            </Nav.Item>
        )
        : ( 
            <Nav.Item key={idx}>
                <Nav.Link className="pos-center" eventKey={"item" + idx} href={"#"} onClick={logout}>{item}</Nav.Link>
            </Nav.Item>
        )
        ;
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