"use client";

import { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import AttributeInfoPopup from "./Popup";
import { BASE_URL } from "../../config";
import { validateAllData, ValidationError } from "@/utils/ValidateFunction";

ModuleRegistry.registerModules([AllCommunityModule]);

const dataTypes = ["Clients", "Workers", "Tasks"];

const columnDefs = {
    Clients: [
        { field: "_id", headerName: "ID", editable: false },
        { field: "ClientID", headerName: "Client ID", editable: true },
        { field: "ClientName", headerName: "Client Name", editable: true },
        { field: "PriorityLevel", headerName: "Priority", editable: true },
        { field: "RequestedTaskIDs", headerName: "Task IDs", editable: true },
        { field: "GroupTag", headerName: "Group", editable: true },
        {
            field: "AttributesJSON",
            headerName: "Attributes ℹ️",
            editable: false,
            cellRenderer: (params: any) => <AttributeInfoPopup value={params.value} />,
        },
    ],
    Workers: [
        { field: "_id", headerName: "ID", editable: false },
        { field: "worker_id", headerName: "Worker ID", editable: true },
        { field: "worker_name", headerName: "Worker Name", editable: true },
        { field: "skills", headerName: "Skills", editable: true },
        { field: "available_slots", headerName: "Available Slots", editable: true },
        { field: "max_load_per_phase", headerName: "Max Load", editable: true },
        { field: "worker_group", headerName: "Group", editable: true },
        { field: "qualification_level", headerName: "Qualification", editable: true },
    ],
    Tasks: [
        { field: "_id", headerName: "ID", editable: false },
        { field: "Task ID", headerName: "Task ID", editable: true },
        { field: "Task Name", headerName: "Task Name", editable: true },
        { field: "Category", headerName: "Category", editable: true },
        { field: "Duration", headerName: "Duration", editable: true },
        { field: "Required Skills", headerName: "Required Skills", editable: true },
        { field: "Preferred Phases", headerName: "Preferred Phases", editable: true },
        { field: "Max Concurrent", headerName: "Max Concurrent", editable: true },
    ],
};

export default function UploadGridTabs() {
    const [activeTab, setActiveTab] = useState<"Clients" | "Workers" | "Tasks">("Clients");

    const [allClients, setAllClients] = useState<any[]>([]);
    const [allWorkers, setAllWorkers] = useState<any[]>([]);
    const [allTasks, setAllTasks] = useState<any[]>([]);

    const [rowData, setRowData] = useState<any[]>([]);
    const [validationErrors, setValidationErrors] = useState<{
        Clients: ValidationError[];
        Workers: ValidationError[];
        Tasks: ValidationError[];
    }>({
        Clients: [],
        Workers: [],
        Tasks: [],
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [clientsRes, workersRes, tasksRes] = await Promise.all([
                    fetch(`${BASE_URL}/clients`),
                    fetch(`${BASE_URL}/workers`),
                    fetch(`${BASE_URL}/tasks`)
                ]);

                const clientsJson = await clientsRes.json();
                const workersJson = await workersRes.json();
                const tasksJson = await tasksRes.json();

                const clients = clientsJson.data || [];
                const workers = workersJson.data || [];
                const tasks = tasksJson.data || [];

                setAllClients(clients);
                setAllWorkers(workers);
                setAllTasks(tasks);


                const result = validateAllData(clients, workers, tasks);
                setValidationErrors(result.errors);
            } catch (err) {
                console.error("❌ Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    useEffect(() => {

        if (activeTab === "Clients") setRowData(allClients);
        else if (activeTab === "Workers") setRowData(allWorkers);
        else if (activeTab === "Tasks") setRowData(allTasks);
    }, [activeTab, allClients, allWorkers, allTasks]);

    const defaultColDef = {
        flex: 1,
        editable: true,
        resizable: true,
        cellClassRules: {
            'cell-error': (params) => {
                const errors = validationErrors[activeTab] || [];

                // Make sure we have valid params
                if (!params.node || !params.colDef) {
                    return false;
                }

                const hasError = errors.some(
                    (err) => err.rowIndex === params.node.rowIndex && err.field === params.colDef.field
                );

                // Debug logging (remove after fixing)
                if (hasError) {
                    console.log('Error found for cell:', {
                        rowIndex: params.node.rowIndex,
                        field: params.colDef.field,
                        activeTab,
                        errorDetails: errors.filter(err => err.rowIndex === params.node.rowIndex && err.field === params.colDef.field)
                    });
                }

                return hasError;
            }
        }
    };
    useEffect(() => {
        console.log("Validation Errors:", validationErrors);
    }), [validationErrors, activeTab, allClients, allWorkers, allTasks, activeTab];


    return (
        <div className="w-full mt-4">
            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
                {dataTypes.map((type) => (
                    <button
                        key={type}
                        className={`px-4 py-2 border rounded ${activeTab === type ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                        onClick={() => setActiveTab(type as any)}
                    >
                        {type}
                    </button>
                ))}
            </div>


            <div className="mb-3">
                {validationErrors[activeTab]?.length > 0 && (
                    <div className="p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm max-h-52 overflow-y-auto">
                        <p className="font-semibold mb-2">Validation Issues:</p>
                        <ul className="list-disc ml-5">
                            {validationErrors[activeTab].map((e, i) => (
                                <li key={i}>
                                    <strong>Row {e.rowIndex + 1}</strong> — <em>{e.field}</em>: {e.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>


            <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
                {loading ? (
                    <div className="text-center mt-20 text-gray-500">Loading {activeTab}...</div>
                ) : (
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs[activeTab]}
                        theme="legacy"
                        defaultColDef={defaultColDef}



                    />
                )}
            </div>



            {/* Updated CSS with higher specificity */}
            <style jsx global>{`
                .ag-theme-alpine .ag-cell.cell-error {
                    background-color: #ffe4e6 !important;
                    border: 1px solid #f87171 !important;
                }
                
                .ag-theme-alpine .ag-cell.cell-error.ag-cell-focus {
                    background-color: #ffe4e6 !important;
                    border: 1px solid #f87171 !important;
                }
            `}</style>
        </div>
    );
}
