import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTable } from "react-table";

const serverUrl = "http://localhost:3000";

const BusFleets = () => {
  const [pendingFleetRequests, setPendingFleetRequests] = useState([]);
  const [approvedFleets, setApprovedFleets] = useState([]);

  // Fetch data from the backend and update state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${serverUrl}/bus/get/busfleet`);
        const data = response.data;

        // Filter data based on fleetStatus
        const pendingRequests = data.filter((fleet) => fleet.fleetStatus === "Pending");
        const approvedFleets = data.filter((fleet) => fleet.fleetStatus === "Approved");

        setPendingFleetRequests(pendingRequests);
        setApprovedFleets(approvedFleets);

      } catch (error) {
        console.error("Error fetching bus fleet data:", error);
      }
    };

    fetchData();
  }, []);

  // Define columns for react-table
  const pendingColumns = React.useMemo(() => [
    { Header: "Fleet Name", accessor: "fleetName" },
    { Header: "Registration Number", accessor: "fleetRegistrationNumber" },
    {
      Header: "Action",
      accessor: "action",
      Cell: ({ row }) => (
        <div>
          <button onClick={() => handleApprove(row.original)}>Approve</button>
          <button onClick={() => handleReject(row.original)}>Reject</button>
        </div>
      ),
    },
  ], []);

  const approvedColumns = React.useMemo(() => [
    { Header: "Fleet ID", accessor: "fleetId" },
    { Header: "Fleet Name", accessor: "fleetName" },
    { Header: "Registration Number", accessor: "fleetRegistrationNumber" },
    { Header: "Manager ID", accessor: "managerId" },
  ], []);

  // Use react-table to get table properties and methods
  const {
    getTableProps: getPendingTableProps,
    getTableBodyProps: getPendingTableBodyProps,
    headerGroups: pendingHeaderGroups,
    rows: pendingRows,
    prepareRow: preparePendingRow,
  } = useTable({ columns: pendingColumns, data: pendingFleetRequests });

  const {
    getTableProps: getApprovedTableProps,
    getTableBodyProps: getApprovedTableBodyProps,
    headerGroups: approvedHeaderGroups,
    rows: approvedRows,
    prepareRow: prepareApprovedRow,
  } = useTable({ columns: approvedColumns, data: approvedFleets });

   // Handle confirm and reject actions for pending fleet requests
   const handleApprove = async (fleet) => {
    try {
      // Make API call to approve the fleet request
      const response = await axios.post(`${serverUrl}/bus/verify/busfleet`, {
        fleetRegistrationNumber: fleet.fleetRegistrationNumber,
        fleetStatus: "Approved",
        notes: "Fleet approved",
      });

      // Update state with the new approved fleet
      setApprovedFleets(prevApprovedFleets => [...prevApprovedFleets, response.data]);
      
      // Remove the fleet from pending requests
      setPendingFleetRequests(pendingFleetRequests.filter(item => item !== fleet));
    } catch (error) {
      console.error("Error approving fleet:", error);
    }
  };

  const handleReject = async (fleet) => {
    try {
      // Make API call to reject the fleet request
      await axios.post(`${serverUrl}/bus/verify/busfleet`, {
        fleetRegistrationNumber: fleet.fleetRegistrationNumber,
        fleetStatus: "Rejected",
        notes: "Fleet rejected",
      });

      // Remove the fleet from pending requests
      setPendingFleetRequests(pendingFleetRequests.filter(item => item !== fleet));
    } catch (error) {
      console.error("Error rejecting fleet:", error);
    }
  };

  return (
    <div>
      <h1>Bus Fleets</h1>

      {/* Pending Fleet Requests Table */}
      <h2>Pending Fleet Requests</h2>
      <table {...getPendingTableProps()}>
        <thead>
          {pendingHeaderGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getPendingTableBodyProps()}>
          {pendingRows.map((row) => {
            preparePendingRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Approved Fleets Table */}
      <h2>Approved Fleets</h2>
      <table {...getApprovedTableProps()}>
        <thead>
          {approvedHeaderGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getApprovedTableBodyProps()}>
          {approvedRows.map((row) => {
            prepareApprovedRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BusFleets;
