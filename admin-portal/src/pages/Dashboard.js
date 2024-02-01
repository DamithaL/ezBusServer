// Dashboard.js
import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import BusFleets from "./BusFleets";
import BusManagers from "./BusManagers";
import BusRoutes from "./BusRoutes";
import BusStops from "./BusStops";
import RouteStops from "./RouteStops";
import Fares from "./Fares";
import Transactions from "./Transactions";

const Dashboard = ({ user, onLogout }) => {
	return (
		<div>
			<h1>Welcome, {user.username}!</h1>
			<nav>
				<ul>
					<li>
						<Link to="/busFleets">Bus Fleets</Link>
					</li>
					<li>
						<Link to="/busManagers">Bus Managers</Link>
					</li>
					<li>
						<Link to="/busRoutes">Bus Routes</Link>
					</li>
					<li>
						<Link to="/busStops">Bus Stops</Link>
					</li>
					<li>
						<Link to="/routeStops">Route Stops</Link>
					</li>
					<li>
						<Link to="/fares">Fares</Link>
					</li>
					<li>
						<Link to="/transactions">Transactions</Link>
					</li>
				</ul>
			</nav>
			<button onClick={onLogout}>Logout</button>

			<Routes>
				<Route path="/busFleets" element={<BusFleets />} />
				<Route path="/busManagers" element={<BusManagers />} />
				<Route path="/busRoutes" element={<BusRoutes />} />
				<Route path="/busStops" element={<BusStops />} />
				<Route path="/routeStops" element={<RouteStops />} />
				<Route path="/fares" element={<Fares />} />
				<Route path="/transactions" element={<Transactions />} />
			</Routes>
		</div>
	);
};

export default Dashboard;
