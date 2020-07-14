import React from 'react';
import PropTypes from 'prop-types';
import Nav from 'react-bootstrap/Nav';
import EditorGUI from './editor/EditorGUI.jsx';

// The container defining the structure of the dashboard
export default class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            navItems: ["Home", "Register", "Login"]
        }
    }
    render() {
        return (
            <div className="container-fluid">
                <div className="row">
                    <SideMenu items={this.state.navItems}/>
                    <EditorGUI title="Screaming Goat" />
                </div>
            </div>
        );
    }
}

const SideMenu = (props) => {
    const menuItems = props.items.map((item, idx) => {
        return ( 
            <Nav.Item key={idx}>
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