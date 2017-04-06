/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var UI;
    (function (UI) {
        "use strict";
        var PermitList = [];
        var CurrentPermits = [];
        var InspectionList = [];
        var CurrentInspections = [];
        var ContractorList = [];
        var CurrentContractor = [];
        var CurrentInspTypes = [];
        var InspTypeList = [];
        function Search(key) {
            clearElement(document.getElementById('SearchFailed'));
            clearElement(document.getElementById('Scheduler'));
            Hide('PermitSelectContainer');
            Hide('CurrentPermitData');
            Hide('InspectionScheduler');
            Hide('CurrentPermit');
            Hide('InspectionTable');
            Show('Searching');
            Hide('SearchFailed');
            Hide('SuspendedContractor');
            var k = key.trim().toUpperCase();
            document.getElementById('PermitSearch').setAttribute("value", k);
            if (k.length == 8 && !isNaN(Number(k))) {
                GetPermitList(k);
            }
            else {
                Hide('Searching');
                UpdateSearchFailed(key);
                return false;
            }
        }
        UI.Search = Search;
        function ProcessResults(permits, key) {
            var tbl = document.getElementById('InspectionTable');
            AddPermit(permits, key);
            UpdatePermitData(key, permits);
            if (permits.length == 0) {
                UpdateSearchFailed(key);
            }
            else {
                Hide('Searching');
                document.getElementById('CurrentPermitData').style.display = "block";
                ShowTable(key, permits);
            }
        }
        /**********************************
          
          Build Option List
        
        **********************************/
        function GetPermitList(key, permit) {
            InspSched.transport.GetPermit(key).then(function (permits) {
                CurrentPermits = permits;
                ProcessResults(permits, key);
                return true;
            }, function () {
                console.log('error getting permits');
                // do something with the error here
                // need to figure out how to detect if something wasn't found
                // versus an error.
                Hide('Searching');
                return false;
            });
        }
        function AddPermit(permits, key) {
            var container = document.getElementById('PermitSelect');
            clearElement(container);
            var current = buildPermitSelectOptGroup("Search Results", "current");
            var related = buildPermitSelectOptGroup("Related Permits", "related");
            container.appendChild(current);
            if (permits.length > 1) {
                container.appendChild(related);
            }
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == key) {
                    current.appendChild(buildPermitSelectOption(permit, key));
                    GetInspList(key, permit);
                }
                else {
                    if (permits.length > 1)
                        related.appendChild(buildPermitSelectOption(permit, key));
                }
            }
        }
        function UpdatePermitData(key, permits) {
            Hide('');
            var street = document.getElementById('ProjAddrCombined');
            var city = document.getElementById('ProjCity');
            for (var _i = 0, permits_2 = permits; _i < permits_2.length; _i++) {
                var permit = permits_2[_i];
                if (permit.PermitNo == key) {
                    Show('PermitSelectContainer');
                    street.innerHTML = permit.ProjAddrCombined.trim();
                    city.innerHTML = permit.ProjCity.trim();
                    break;
                }
            }
        }
        UI.UpdatePermitData = UpdatePermitData;
        function buildPermitSelectOptGroup(lbl, val) {
            //let og = document.createElement( "optgroup" );
            var og = document.createElement("optgroup");
            og.label = lbl;
            og.value = val;
            return og;
        }
        function createOptGroupElement(value, className) {
            var og = document.createElement("optgroup");
            if (className !== undefined) {
                og.className = className;
            }
            og.label = value;
            og.appendChild(document.createTextNode(value));
            return og;
        }
        function buildPermitSelectOption(permit, key) {
            var option = document.createElement("option");
            option.setAttribute("value", permit.PermitNo.trim());
            option.setAttribute("label", permit.PermitNo + "  (" + permit.PermitTypeDisplay + ")");
            option.setAttribute("title", permit.PermitNo.trim());
            option.textContent = permit.PermitNo + "  (" + permit.PermitTypeDisplay + ")";
            option.id = permit.PermitNo + permit.CanSchedule;
            if (permit.PermitNo == key) {
                option.value = permit.PermitNo.trim();
                option.selected = true;
            }
            else {
                option.value = permit.PermitNo.trim();
                option.selected = false;
            }
            return option;
        }
        /**********************************
      
        Initial build:
          list is filled during search
          ProcessResults() calls GetInspList()
      
        Updating the Inspection List:
          select element: 'PermitSelect' will \
          trigger onchange event calling
          UpdateInspList()
        
        ***********************************/
        function GetInspList(key, permit) {
            var completed = 0;
            var canSchedule = true;
            Hide('InspSched');
            Hide('InspListHeader');
            Hide('InspListData');
            Hide('InspectionScheduler');
            Hide('SuspendedContractor');
            document.getElementById('FutureInspRow').removeAttribute("value");
            clearElement(document.getElementById('InspListData'));
            clearElement(document.getElementById('Scheduler'));
            clearElement(document.getElementById('InspectionType'));
            clearElement(document.getElementById('Scheduler'));
            InspSched.transport.GetInspections(key).then(function (inspections) {
                if (inspections.length > 0) {
                    CurrentInspections = inspections;
                    BuildInspectionList(inspections, permit);
                }
                else {
                    document.getElementById('PermitScreen').style.display = "flex";
                    BuildScheduler(inspections, canSchedule, completed, key);
                }
                return true;
            }, function () {
                console.log('error getting inspections');
                return false;
            });
        }
        UI.GetInspList = GetInspList;
        function BuildInspectionList(inspections, permit) {
            var completed = 0;
            var canSchedule = true;
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var InspHeader = document.getElementById('InspListHeader');
            var empty = document.createElement("tr");
            // TODO: add Try/Catch
            if (inspections.length > 0) {
                // create (call BuildInspectioN()) and add inspection row to container InspList
                for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                    var inspection = inspections_1[_i];
                    if (inspection.ResultADC && inspection.InspDateTime) {
                        InspList.appendChild(BuildCompletedInspection(inspection));
                        completed++;
                    }
                    else if (!inspection.ResultADC) {
                        clearElement(document.getElementById('Scheduler'));
                        BuildFutureInspRow(inspection);
                        canSchedule = false;
                    }
                }
                if (completed > 0) {
                    InspHeader.style.removeProperty("display");
                    InspList.style.removeProperty("display");
                }
                document.getElementById('PermitScreen').style.display = "flex";
            }
            else {
            }
            BuildScheduler(inspections, canSchedule, completed);
        }
        UI.BuildInspectionList = BuildInspectionList;
        function BuildCompletedInspection(inspection) {
            var inspRow = document.createElement("div");
            inspRow.className = "row large-12";
            var inspDateTime = document.createElement("div");
            inspDateTime.textContent = inspection.DisplayInspDateTime.trim();
            inspDateTime.className = "large-3 medium-2 small-12 inspDate ";
            inspRow.appendChild(inspDateTime);
            var inspDesc = document.createElement("div");
            inspDesc.textContent = inspection.InsDesc.trim();
            inspDesc.className = "large-8 medium-8 small-9 inspType ";
            inspRow.appendChild(inspDesc);
            var ResultADC = document.createElement("div");
            ResultADC.textContent = inspection.ResultADC.trim();
            ResultADC.className = "large-1 medium-1 small-1 inspResult";
            ResultADC.style.textAlign = "center";
            inspRow.appendChild(ResultADC);
            inspRow.appendChild(document.createElement("hr"));
            if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'C' || inspection.ResultADC == 'N') {
            }
            return inspRow;
        }
        function BuildFutureInspRow(inspection) {
            var schedBody = document.getElementById('InspSchedBody');
            document.getElementById('InspSched').setAttribute("value", inspection.PermitNo);
            document.getElementById('FutureInspRow').setAttribute("value", inspection.InspReqID);
            document.getElementById('ScheduledDate').innerText = inspection.DisplaySchedDateTime;
            document.getElementById('InspectionType').innerText = inspection.InsDesc;
            document.getElementById('InspectorName').innerText = inspection.InspectorName;
            document.getElementById('CancelButton').setAttribute("value", inspection.PermitNo);
            document.getElementById('InspSched').style.removeProperty("display");
            document.getElementById('FutureInspRow').style.removeProperty("display");
            schedBody.style.removeProperty("display");
        }
        /**********************************************
         *
         * Build Scheduler
         * Get and build select list of inspections
         *
         *********************************************/
        function BuildScheduler(inspections, canSchedule, completed, key) {
            if (inspections.length > 0)
                key = inspections[0].PermitNo;
            if (canSchedule) {
                GetInspType(key);
                InspSched.transport.CheckContractorPermitStatus(key).then(function (contractors) {
                    CurrentContractor = contractors;
                    var fail = document.getElementById(key + "FAIL");
                    var pass = document.getElementById(key + "PASS");
                    // if contractor IS ALLOWED to schedule, the contractor id will be on the list
                    if (CurrentContractor.length > 0 && pass) {
                        BuildSchdeuleCalendar();
                        document.getElementById('InspectionScheduler').style.removeProperty("display");
                    }
                    else if (CurrentContractor.length <= 0 || fail) {
                        // TODO Add code to display suspended contractor
                        var e = document.getElementById('SuspendedPermit');
                        clearElement(e);
                        var message = document.createElement("h5");
                        message.appendChild(document.createTextNode("An inspection cannot be scheduled for permit #" + inspections[0].PermitNo + "."));
                        message.appendChild(document.createElement("br"));
                        message.appendChild(document.createElement("br"));
                        message.appendChild(document.createTextNode("\nPlease contact the permit department to " +
                            "determine what steps can be taken to allow inspection scheduling"));
                        e.appendChild(message);
                        document.getElementById('SuspendedContractor').style.removeProperty("display");
                    }
                    return true;
                }, function () {
                    console.log('error in Scheduler');
                    return false;
                });
            }
        }
        function BuildSchdeuleCalendar() {
            InspSched.transport.generateDates().then(function (dates) {
                var datesDisabled = "[";
                var minDate = dates[0];
                if (dates.length > 2) {
                    for (var i = 1; (i < dates.length - 2); i++) {
                        datesDisabled += dates[i] + ", ";
                    }
                    datesDisabled += dates[dates.length - 2] + "]";
                }
                var maxDate = dates[dates.length - 1];
                return true;
            }, function () {
                console.log('error in generateDates');
                // do something with the error here
                // need to figure out how to detect if something wasn't found
                // versus an error.
                Hide('Searching');
                return false;
            });
            var element = document.getElementById('CalendarScriptLocation');
            //clearElement( element );
        }
        function GetInspType(key) {
            var thistype = key[0];
            var InspTypeList = document.getElementById('InspTypeSelect');
            clearElement(InspTypeList);
            var optionLabel = document.createElement("option");
            switch (thistype) {
                case '1':
                case '0':
                case '9':
                    optionLabel.label = "Building";
                    break;
                case '2':
                    optionLabel.label = "Electrical";
                    break;
                case '3':
                    optionLabel.label = "Plumbing";
                    break;
                case '4':
                    optionLabel.label = "Mechanical";
                    break;
                case '6':
                    optionLabel.label = "Fire";
                    break;
            }
            optionLabel.label += " Inspections:";
            optionLabel.className = "selectPlaceholder";
            optionLabel.selected;
            optionLabel.value = "";
            InspTypeList.appendChild(optionLabel);
            InspSched.transport.GetInspType(key).then(function (insptypes) {
                CurrentInspTypes = insptypes;
                for (var _i = 0, insptypes_1 = insptypes; _i < insptypes_1.length; _i++) {
                    var type = insptypes_1[_i];
                    var option = document.createElement("option");
                    option.label = type.InsDesc;
                    option.value = type.InspCd;
                    InspTypeList.appendChild(option);
                }
                InspTypeList.required;
                return true;
            }, function () {
                console.log('error getting inspection types');
                return false;
            });
        }
        /**********************************
        
          Do Somethings
        
        ***********************************/
        function createNewElement(elementType, classname, value, id) {
            var element = document.createElement(elementType);
            if (classname !== undefined)
                element.className = classname;
            else
                element.className = "";
            if (value !== undefined)
                element.nodeValue = value;
            else
                element.nodeValue = "";
            if (id !== undefined)
                element.id = id;
            else
                element.id = "";
            element.appendChild(document.createTextNode(value));
            return element;
        }
        function Show(id, element, displayType) {
            if (!element) {
                var e = document.getElementById(id);
                if (displayType == null)
                    e.style.display = "block";
                else
                    e.style.display = displayType;
            }
            else {
                var e = document.getElementById(id);
                if (displayType == null)
                    element.style.display = "block";
                else
                    element.style.display = displayType;
            }
        }
        function Hide(id) {
            var e = document.getElementById(id);
            if (e)
                e.style.display = "none";
        }
        // this function emptys an element of all its child nodes.
        function clearElement(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        UI.clearElement = clearElement;
        function ShowTable(key, permits) {
            var inspectionTable = document.getElementById('InspectionTable');
            if (permits) {
                Hide('Searching');
                inspectionTable.style.removeProperty("display");
            }
        }
        function UpdateSearchFailed(key) {
            var e = document.getElementById('SearchFailed');
            clearElement(e);
            var message = document.createElement("h3");
            if (!isNaN(Number(key)) && key.length == 8) {
                message.appendChild(document.createTextNode("Permit #" + key + " not found"));
            }
            else if (!isNaN(Number(key)) && key.length != 8) {
                message.innerHTML = "You did not enter any information.<br />Enter a valid permit number to search.";
            }
            else if (key.length == 0) {
                message.innerHTML = key + " is not a valid Permit Number";
            }
            else {
                message.innerHTML = "Invalid Entry<br />";
            }
            e.appendChild(message);
            Hide('Searching');
            Show('SearchFailed');
        }
        function CancelInspection(InspID, key) {
            if (InspID && key) {
                //Hide( 'FutureInspRow' );
                // TODO: Add function to not allow cancel if scheduled date of insp is current date 
                var isDeleted = InspSched.transport.CancelInspection(key, InspID);
                // TODO: ADD code to inform user if the inspection has been deleted 
                // Reload inspection list after delete
                if (isDeleted)
                    GetInspList(key);
                else {
                }
            }
            else {
                console.log("There is no scheduled inspection to cancel");
                document.getElementById('InspSched').style.display = "none";
            }
        }
        UI.CancelInspection = CancelInspection;
        function SaveInspection() {
            return true;
        }
        UI.SaveInspection = SaveInspection;
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map