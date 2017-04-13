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
            document.getElementById('InspectionScheduler').removeAttribute("value");
            var saveButton = document.getElementById('SaveSchedule');
            if (saveButton != undefined)
                saveButton.removeAttribute("value");
            var completed = 0;
            var canSchedule = true;
            Hide('InspSched');
            Hide('InspListHeader');
            Hide('InspListData');
            Hide('InspectionScheduler');
            Hide('SuspendedContractor');
            document.getElementById('FutureInspRow').removeAttribute("value");
            clearElement(document.getElementById('InspListData'));
            //clearElement( document.getElementById( 'InspectionType' ) );
            InspSched.transport.GetInspections(key).then(function (inspections) {
                if (inspections.length > 0) {
                    CurrentInspections = inspections;
                    BuildInspectionList(inspections, permit);
                }
                else {
                    BuildScheduler(inspections, canSchedule, completed, key);
                    document.getElementById('PermitScreen').style.display = "flex";
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
            var NumFutureInsp = 0;
            var canSchedule = true;
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var InspHeader = document.getElementById('InspListHeader');
            var empty = document.createElement("tr");
            clearElement(document.getElementById('FutureInspRow'));
            // TODO: add Try/Catch
            if (inspections.length > 0) {
                // create (call BuildInspectioN()) and add inspection row to container InspList
                for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                    var inspection = inspections_1[_i];
                    if (inspection.ResultADC) {
                        if (completed < 5) {
                            InspList.appendChild(BuildCompletedInspection(inspection));
                            completed++;
                        }
                    }
                    else if (!inspection.ResultADC) {
                        NumFutureInsp++;
                        BuildFutureInspRow(inspection, NumFutureInsp);
                    }
                }
                if (NumFutureInsp) {
                    document.getElementById('FutureInspRow').setAttribute("value", inspections[0].PermitNo);
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
        function BuildFutureInspRow(inspection, numFutureInsp) {
            var schedBody = document.getElementById('InspSchedBody');
            var futureRow = document.getElementById('FutureInspRow');
            var thisinsp = document.createElement("div");
            var dateName = document.createElement("div");
            var thisinspDate = document.createElement("div");
            var thisinspType = document.createElement("div");
            var thisinspInspector = document.createElement("div");
            var thisinspCancelDiv = document.createElement("div");
            var thisinspCancelButton = document.createElement("button");
            thisinsp.setAttribute("id", inspection.InspReqID + "_" + numFutureInsp);
            thisinsp.className = "InspBorderBottom large-12 medium-12 small-12 row";
            thisinspDate.className = "large-2 medium-2 small-4 column align-center column";
            thisinspType.className = "large-5 medium-4 small-8 column align-center column ";
            thisinspInspector.className = "large-3 medium-4 hide-for-small-only end column align-center";
            thisinspCancelDiv.className = "large-2 medium-2 small-12 column flex-container align-center";
            thisinspCancelButton.className = " button";
            thisinspDate.innerText = inspection.DisplaySchedDateTime;
            thisinspType.innerText = inspection.InsDesc;
            thisinspInspector.innerText = inspection.InspectorName;
            thisinspCancelButton.innerText = "Cancel";
            document.getElementById('InspSched').style.removeProperty("display");
            document.getElementById('FutureInspRow').style.removeProperty("display");
            thisinspCancelButton.setAttribute("onclick", "( InspSched.UI.CancelInspection(\"" + inspection.InspReqID + "\", \"" + inspection.PermitNo + "\" ) )");
            //thisinspCancelButton.setAttribute( "type", "button" );
            thisinspCancelDiv.appendChild(thisinspCancelButton);
            thisinsp.appendChild(thisinspDate);
            thisinsp.appendChild(thisinspType);
            thisinsp.appendChild(thisinspInspector);
            thisinsp.appendChild(thisinspCancelDiv);
            futureRow.appendChild(thisinsp);
            schedBody.style.removeProperty("display");
        }
        /**********************************************
         *
         * Build Scheduler
         * Get and build select list of inspections@
         *
         *********************************************/
        function BuildScheduler(inspections, canSchedule, completed, key) {
            if (inspections.length > 0)
                key = inspections[0].PermitNo;
            if (canSchedule) {
                InspSched.transport.CheckContractorPermitStatus(key).then(function (contractors) {
                    CurrentContractor = contractors;
                    var fail = document.getElementById(key + "FAIL");
                    var pass = document.getElementById(key + "PASS");
                    // if contractor IS ALLOWED to schedule, the contractor id will be on the list
                    if (CurrentContractor.length > 0 && pass) {
                        // Populate Inspection Type Select list
                        GetInspType(key);
                        //BuildSchdeuleCalendar();
                        document.getElementById('InspectionScheduler').style.removeProperty("display");
                        document.getElementById('InspectionScheduler').setAttribute("value", key);
                    }
                    else if (CurrentContractor.length <= 0 || fail) {
                        // TODO Add code to display suspended contractor
                        var e = document.getElementById('SuspendedPermit');
                        clearElement(e);
                        var message = document.createElement("h5");
                        message.appendChild(document.createTextNode("A new inspection cannot be scheduled for permit #" + key + "."));
                        message.appendChild(document.createElement("br"));
                        message.appendChild(document.createElement("br"));
                        message.appendChild(document.createTextNode("\nIf you are unable to schedule your inspection " +
                            "through this site please call the Building Department " +
                            "for assistance at 904-284-6307.  Inspections may not " +
                            "be able to be scheduled on line due to many reasons " +
                            "(fees due, permit problems, holds, or licensing issues)."));
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
        function BuildScheduleCalendar() {
            //transport.GenerateDates().then( function ( dates: Array<Dates> ): Array<Dates>
            //{
            //  let datesDisabled: string = "[";
            //  let minDate: Dates = dates[0];
            //  if ( dates.length > 2 )
            //  {
            //    for ( let i: number = 1; ( i < dates.length - 2 ); i++ )
            //    {
            //      datesDisabled += dates[i] + ", ";
            //    }
            //    datesDisabled += dates[dates.length - 2] + "]";
            //  }
            //  else
            //    datesDisabled += "]";
            //  let maxDate: Dates = dates[dates.length - 1];
            //  return dates;
            //},
            //  function ()
            //  {
            //    console.log( 'error in generateDates' );
            //    // do something with the error here
            //    // need to figure out how to detect if something wasn't found
            //    // versus an error.
            //    Hide( 'Searching' );
            //    return null;
            //  });
            //let element: HTMLScriptElement = ( <HTMLScriptElement>document.getElementById( 'CalendarScriptLocation' ) );
            //clearElement( element );
        }
        UI.BuildScheduleCalendar = BuildScheduleCalendar;
        function GetInspType(key) {
            var thistype = key[0];
            var InspTypeList = document.getElementById('InspTypeSelect');
            var optionLabel = document.createElement("option");
            clearElement(InspTypeList);
            switch (thistype) {
                case '1':
                case '0':
                case '9':
                    optionLabel.label = "Building";
                    thistype = "1";
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
            optionLabel.innerText = optionLabel.label;
            optionLabel.className = "selectPlaceholder";
            optionLabel.selected;
            optionLabel.value = "";
            InspTypeList.appendChild(optionLabel);
            for (var _i = 0, InspectionTypes_1 = InspSched.InspectionTypes; _i < InspectionTypes_1.length; _i++) {
                var type = InspectionTypes_1[_i];
                if (type.InspCd[0] == thistype) {
                    var option = document.createElement("option");
                    option.label = type.InsDesc;
                    option.value = type.InspCd;
                    option.className = "TypeSelectOption";
                    InspTypeList.appendChild(option);
                    option.innerText = type.InsDesc;
                }
            }
            //transport.GetInspType().then( function ( insptypes: Array<InspType> )
            //{
            //  CurrentInspTypes = insptypes;
            //  for ( let type of insptypes )
            //  {
            //    if ( type.InspCd[0] == thistype )
            //    {
            //      let option = document.createElement( "option" );
            //      option.label = type.InsDesc;
            //      option.value = type.InspCd;
            //      option.className = "TypeSelectOption";
            //      InspTypeList.appendChild( option );
            //      option.innerText = type.InsDesc;
            //    }
            //  }
            //  InspTypeList.required;
            //  return true;
            //},
            //  function ()
            //  {
            //    console.log( 'error getting inspection types' );
            //    return false;
            //  });
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
                var isDeleted = InspSched.transport.CancelInspection(InspID, key);
                // TODO: ADD code to inform user if the inspection has been deleted 
                // Reload inspection list after delete
                if (isDeleted) {
                    GetInspList(key);
                }
                else {
                }
            }
            else {
                console.log("There is no scheduled inspection to cancel");
                document.getElementById('InspSched').style.display = "none";
            }
        }
        UI.CancelInspection = CancelInspection;
        function SaveInspection(PermitNo, InspCd, date) {
            InspSched.transport.SaveInspection(PermitNo, InspCd, date).then(function (isSaved) {
                return true;
            }, function () {
                console.log("Error in SaveInspection");
                //GetInspType( PermitNo );
            });
        }
        UI.SaveInspection = SaveInspection;
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map