import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable } from 'react-table';

const BusManagers = () => {
  const [busManagers, setBusManagers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(	"http://localhost:3000/bus/get/busfleet");
        setBusManagers(response.data);
      } catch (error) {
        console.error('Error fetching bus manager data:', error);
      }
    };

    fetchData();
  }, []);

  const columns = React.useMemo(
    () => [
      { Header: 'Manager ID', accessor: 'managerId' },
      { Header: 'Name', accessor: 'managerName' },
      { Header: 'Email', accessor: 'managerEmail' },
      // Add more columns as needed
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: busManagers });

  return (
    <div>
      <h1>Bus Managers</h1>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BusManagers;
