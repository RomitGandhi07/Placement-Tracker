import React, { useState, useEffect } from "react";
import { EuiPanel, EuiFieldSearch, EuiButton } from "@elastic/eui";
import { useHistory } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import _ from "lodash";

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import SidebarNew from "../sidebar/SidebarNew";
import Header from "../header";

function GetApplicants(props) {
    const history = useHistory();
    const [busy, setBusy] = useState(true);
    const [gridApi, setGridApi] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(undefined);

    useEffect(() => {
        const fetchData = async () => {
            let response = await fetch(
                `http://localhost:6700/opportunity/${props.match.params.id}/applicants`
            );
            response = await response.json();
            if (response.statusCode == 200) {
                setRowData(response.data.applicants);
                setCompanyInfo({
                    companyName: response.data.companyName,
                    id: response.data._id,
                });
                setBusy(false);
            } else {
                alert("Something went wrong...Please try again");
                history.replace("/admin/allOpportunities");
                return;
            }
        };
        fetchData();
    }, []);

    const onChange = async (event) => {
        let response = await fetch(
            `http://localhost:6700/opportunity/${props.match.params.id}/applicants/search?term=${event.target.value}`
        );
        response = await response.json();
        if (response.statusCode == 200) {
            setRowData(response.data.applicants);
            setCompanyInfo({
                companyName: response.data.companyName,
                id: response.data._id,
            });
            setBusy(false);
        } else {
            alert("Something went wrong...Please try again");
            history.replace("/admin/allOpportunities");
            return;
        }
    };

    const viewResume = (params) => {
        const url = `http://localhost:3000/student/resume/${params.value}`;
        return (
            <a href={url} target="_blank">
                View
            </a>
        );
    };

    const [columnDefs] = useState([
        {
            headerName: "First Name",
            field: "studentId.firstName",
        },
        {
            headerName: "Last Name",
            field: "studentId.lastName",
        },
        {
            headerName: "Email",
            field: "studentId.email",
        },
        {
            headerName: "Resume",
            field: "resumeId",
            cellRendererFramework: viewResume,
        },
    ]);

    const onGridReady = (params) => {
        setGridApi(params.api);
    };
    useEffect(() => {
        if (gridApi !== null) {
            gridApi.sizeColumnsToFit();
        }
    }, [gridApi]);

    const onBtExport = () => {
        gridApi.exportDataAsCsv({
            fileName: "applicants.csv",
            processCellCallback: function (cell) {
                var cellVal = cell.value;
                if (_.get(cell, "column.colDef.cellRenderer")) {
                    cellVal = cell.column.colDef.cellRenderer({
                        value: cell.value,
                    });
                    return `http://localhost:3000/student/resume/${cellVal}`;
                }
                return cellVal;
            },
        });
    };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100%" }}>
            <div>
                <SidebarNew current="opportunity" />
            </div>

            <div
                style={{
                    margin: "1rem",
                    width: "100%",
                    maxWidth: "100vw",
                    height: "100%",
                }}
            >
                {companyInfo && (
                    <Header
                        breadcrumbs={[
                            {
                                text: "Opportunity",
                                onClick: () =>
                                    history.push("/admin/allOpportunities"),
                            },
                            {
                                text: companyInfo.companyName,
                                onClick: () =>
                                    history.replace(
                                        `/admin/opportunity/${companyInfo.id}`
                                    ),
                            },
                            { text: "Applicants" },
                        ]}
                    />
                )}
                <EuiPanel style={{ height: "85%" }}>
                    <EuiFieldSearch
                        placeholder="Search Applicants"
                        // value={value}
                        fullWidth
                        isClearable={true}
                        onChange={onChange}
                    />
                    <div
                        className="ag-theme-alpine"
                        style={{
                            height: "80%",
                            width: "100%",
                            marginTop: "1rem",
                        }}
                    >
                        {!busy && (
                            <>
                                <div>
                                    <EuiButton
                                        fill
                                        onClick={() => onBtExport()}
                                        style={{ marginBottom: "1rem" }}
                                    >
                                        Export to CSV
                                    </EuiButton>
                                </div>
                                <AgGridReact
                                    onGridReady={onGridReady}
                                    columnDefs={columnDefs}
                                    rowData={rowData}
                                    width="auto"
                                    pagination={true}
                                    paginationPageSize="7"
                                ></AgGridReact>
                            </>
                        )}
                    </div>
                </EuiPanel>
            </div>
        </div>
    );
}

export default GetApplicants;
