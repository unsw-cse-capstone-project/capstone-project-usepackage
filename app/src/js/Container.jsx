import React from 'react';
import PropTypes from 'prop-types';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
// import { Link, withRouter} from 'react-router-dom';

// The container defining the structure of the dashboard
export default class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            navItems: ["Home", "Register", "Login"],
            loggedInItems: ["Home", "Profile", "Logout"],
            menu: null,
            components: props.components
        }
        this.pickMenu = this.pickMenu.bind(this);
    }

    componentDidMount() {
        this.pickMenu()
    }
    
    pickMenu() {
        if ( localStorage.usertoken ) {
            this.setState({menu: <SideMenu items={this.state.loggedInItems}/>})
        } else {
            this.setState({menu: <SideMenu items={this.state.navItems}/>});
        }
    }

    render() {
        return (
            <>
            {this.state.menu}
            <div className="container-fluid">
                <div className="row">
                    {this.props.main}
                </div>
            </div>
            </>
        );
    }
}

const SideMenu = (props) => {
    const menuItems = props.items.map((item, idx) => {
        const logout = () => {
            localStorage.removeItem('usertoken');
            localStorage.removeItem('poname');
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
    <Navbar bg="light" expand="lg" variant="light">
        <Navbar.Brand href="/"><img src="/logo" width="100%"/></Navbar.Brand>
        <Nav defaultActiveKey="/" className="ml-auto">
            {menuItems}
        </Nav>
    </Navbar>
    );
}

SideMenu.propTypes = {
    items: PropTypes.array
}