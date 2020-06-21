import React from 'react';
import PropTypes from 'prop-types';


// The container defining the structure of the dashboard
export default class Container extends React.Component {
    render() {
        const items = ["Item 1", "Item 2"];
        return (
            <div className="container-fluid">
                <div className="row">
                    <SideMenu items={items}/>
                    
                </div>
            </div>
        );
    }
}

const SideMenu = (props) => {
    const menuItems = props.items.map((item, idx) => {
        return ( 
        <li key={idx} className="nav-item">
            <a className="nav-link">{item}</a>
        </li> 
        );
    })
    return (
    <div className="col-md-2 col-lg-5 d-none d-md-block bg-light sidebar">
        <div className="sidebar-sticky">
            <ul className="flex-column">
                {menuItems}
            </ul>
        </div>
    </div>
    );
}

SideMenu.propTypes = {
    items: PropTypes.array
}