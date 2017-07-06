/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var UI;
    (function (UI) {
        "use strict";
        UI.CurrentPermits = new Array();
        UI.CurrentInspections = [];
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
                return k;
            }
            else {
                Hide('Searching');
                UpdateSearchFailed(key);
                return null;
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
        UI.ProcessResults = ProcessResults;
        /**********************************
          
          Build Option List
        
        **********************************/
        function GetPermitList(key, permit) {
            InspSched.transport.GetPermit(key).then(function (permits) {
                UI.CurrentPermits = permits;
                InspSched.CurrentPermits = permits;
                ProcessResults(permits, key);
                return true;
            }, function () {
                console.log('error in GetPermits');
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
            var label = getInspTypeString(permit.PermitNo[0]);
            var option = document.createElement("option");
            option.setAttribute("value", permit.PermitNo.trim());
            option.setAttribute("label", permit.PermitNo + "  (" + label + ")");
            option.setAttribute("title", permit.PermitNo.trim());
            option.textContent = permit.PermitNo + "  (" + label + ")";
            option.id = "select_" + permit.PermitNo;
            if (permit.PermitNo == key) {
                option.value = permit.PermitNo.trim();
                option.selected = true;
            }
            else {
                option.value = permit.PermitNo.trim();
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
            if (saveButton != undefined) {
                saveButton.setAttribute("disabled", "disabled");
                saveButton.removeAttribute("value");
            }
            var completed = 0;
            var canSchedule = true;
            Hide('InspSched');
            Hide('InspListHeader');
            Hide('InspListData');
            Hide('InspectionScheduler');
            Hide('SuspendedContractor');
            clearElement(document.getElementById('InspListData'));
            InspSched.transport.GetInspections(key).then(function (inspections) {
                if (inspections.length > 0) {
                    InspSched.CurrentInspections = inspections;
                    BuildInspectionList(InspSched.CurrentInspections, permit);
                    BuildScheduler(InspSched.CurrentInspections, key);
                }
                else {
                    // TODO: add 'NO INSPECTIONS ERROR'
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
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var InspHeader = document.getElementById('InspListHeader');
            var empty = document.createElement("tr");
            // TODO: add Try/Catch
            // create (call BuildInspectioN()) and add inspection row to container InspList
            for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                var inspection = inspections_1[_i];
                if (inspection.ResultADC) {
                    InspList.appendChild(BuildCompletedInspection(inspection));
                    completed++;
                }
                else if (!inspection.ResultADC) {
                    InspList.appendChild(BuildFutureInspRow(inspection, NumFutureInsp, InspSched.ThisPermit.IsExternalUser));
                }
            }
            InspList.style.removeProperty("display");
            document.getElementById("InspSched").style.removeProperty("display");
            document.getElementById('PermitScreen').style.display = "flex";
            var passedFinal = false;
            if (passedFinal) {
                //TODO: Update passed final issue
            }
        }
        UI.BuildInspectionList = BuildInspectionList;
        function BuildCompletedInspection(inspection) {
            var ShowCreateNewInsp = document.getElementById("CreateNew_" + inspection.PermitNo);
            var inspRow = document.createElement("div");
            if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
            else if (inspection.ResultADC == null || inspection.ResultADC == "")
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
            else if (inspection.ResultADC == 'C')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow";
            else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";
            var dataColumn = document.createElement("div");
            dataColumn.className = "large-10 medium-10 small-12 ";
            var thisPermit = document.createElement('div');
            thisPermit.innerText = inspection.PermitNo;
            thisPermit.className = "large-2 meduim-6 small-6 column InspPermit ";
            dataColumn.appendChild(thisPermit);
            var inspDateTime = document.createElement("div");
            inspDateTime.textContent = inspection.DisplayInspDateTime.trim();
            inspDateTime.className = "large-2 medium-5 small-6 column  InspDate";
            dataColumn.appendChild(inspDateTime);
            var inspDesc = document.createElement("div");
            inspDesc.textContent = inspection.InsDesc.trim();
            inspDesc.className = "large-5 medium-6 small-6  InspType column  ";
            dataColumn.appendChild(inspDesc);
            var ResultADC = document.createElement("div");
            ResultADC.textContent = inspection.ResultDescription.trim();
            ResultADC.className = "large-3 medium-5 small-6 InspResult column end";
            dataColumn.appendChild(ResultADC);
            var NewInspButtonDiv = document.createElement("div");
            NewInspButtonDiv.className = "large-2 medium-2 small-12  flex-container align-center ";
            if (!ShowCreateNewInsp) {
                var NewInspButton = document.createElement("button");
                NewInspButton.className = "align-self-center myButton small-12 NewInspButton";
                NewInspButton.innerText = "New";
                NewInspButton.value = inspection.PermitNo;
                NewInspButton.setAttribute("onclick", "InspSched.UpdatePermitSelectList(this.value);");
                NewInspButton.id = "CreateNew_" + inspection.PermitNo;
                NewInspButtonDiv.appendChild(NewInspButton);
            }
            inspRow.appendChild(dataColumn);
            inspRow.appendChild(NewInspButtonDiv);
            if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N') {
                var Remarks = document.createElement("div");
                if (inspection.Remarks !== null || inspection.Remarks === "") {
                    Remarks.textContent = "Remarks: " + inspection.Remarks.trim();
                }
                else {
                    Remarks.textContent = "No remarks entered by the inspector. Please contact the Building Department " +
                        "at 904-284-6307 or contact the inspector " +
                        "directly for assistance.";
                }
                Remarks.className = "large-12 medium-12 small-12 inspRemarks";
                inspRow.appendChild(Remarks);
            }
            return inspRow;
        }
        function BuildFutureInspRow(inspection, numFutureInsp, IsExternalUser) {
            var schedBody = document.getElementById('InspSchedBody');
            var dateName = document.createElement("div");
            var thisinsp = document.createElement("div");
            thisinsp.setAttribute("id", inspection.InspReqID + "_" + numFutureInsp);
            thisinsp.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
            var thisPermit = document.createElement('div');
            thisPermit.innerText = inspection.PermitNo;
            thisPermit.className = "large-2 meduim-6 small-6 column InspPermit";
            var thisinspDate = document.createElement("div");
            thisinspDate.className = "large-2 medium-5 small-6 column InspDate ";
            thisinspDate.innerText = inspection.DisplaySchedDateTime;
            var thisinspType = document.createElement("div");
            thisinspType.className = "large-5 medium-6 small-12 column InspType";
            thisinspType.innerText = inspection.InsDesc;
            var thisinspInspector = document.createElement("div");
            thisinspInspector.className = "large-3 medium-5  hide-for-small-only column InspInspector";
            thisinspInspector.innerText = inspection.InspectorName;
            thisinspInspector.setAttribute("style", "float:left;");
            var thisinspCancelDiv = document.createElement("div");
            thisinspCancelDiv.className = "large-2 medium-2 small-12  flex-container align-center";
            var thisinspCancelButton = document.createElement("button");
            thisinspCancelButton.className = "align-self-center myButton small-12 NewInspButton";
            thisinspCancelButton.innerText = "Cancel";
            thisinspCancelButton.value = inspection.PermitNo;
            thisinspCancelButton.setAttribute("onclick", 
            // cancels inspection then re-fetch inspections
            "InspSched.CancelInspection('" + inspection.InspReqID + "', '" + inspection.PermitNo + "');");
            // Display cancel button if good date
            if (IsGoodCancelDate(inspection, IsExternalUser))
                thisinspCancelDiv.appendChild(thisinspCancelButton);
            var dataColumn = document.createElement("div");
            dataColumn.className = "large-10 medium-10 small-12";
            dataColumn.appendChild(thisPermit);
            dataColumn.appendChild(thisinspDate);
            dataColumn.appendChild(thisinspType);
            dataColumn.appendChild(thisinspInspector);
            thisinsp.appendChild(dataColumn);
            thisinsp.appendChild(thisinspCancelDiv);
            document.getElementById('InspSched').style.removeProperty("display");
            return thisinsp;
        }
        /**********************************************
         *
         * Build Scheduler
         * Get and build select list of inspections@
         *
         *********************************************/
        function BuildScheduler(inspections, key) {
            // Populate Inspection Type Select list
            for (var _i = 0, _a = InspSched.CurrentPermits; _i < _a.length; _i++) {
                var permit = _a[_i];
                console.log(permit.PermitNo);
            }
            LoadInspTypeSelect(key);
            document.getElementById('InspectionScheduler').style.display = "flex";
            document.getElementById('InspectionScheduler').setAttribute("value", key);
            //permitSchedulingIssue(key);
        }
        UI.BuildScheduler = BuildScheduler;
        function LoadInspTypeSelect(key) {
            var thistype = key[0];
            var label = getInspTypeString(thistype);
            var InspTypeList = document.getElementById('InspTypeSelect');
            var optionLabel = document.createElement("option");
            clearElement(InspTypeList);
            optionLabel.textContent = label + " Inspections:";
            //optionLabel.label += label +" Inspections:";
            //optionLabel.innerText = optionLabel.label;
            optionLabel.className = "selectPlaceholder";
            optionLabel.selected;
            optionLabel.value = "";
            InspTypeList.appendChild(optionLabel);
            for (var _i = 0, _a = InspSched.InspectionTypes; _i < _a.length; _i++) {
                var type = _a[_i];
                if (type.InspCd[0] == thistype) {
                    var option = document.createElement("option");
                    option.label = type.InsDesc;
                    option.value = type.InspCd;
                    option.className = "TypeSelectOption";
                    InspTypeList.appendChild(option);
                    option.innerText = type.InsDesc;
                }
            }
        }
        UI.LoadInspTypeSelect = LoadInspTypeSelect;
        /**********************************
        
          Do Somethings
        
        ***********************************/
        function getInspTypeString(InspType) {
            switch (InspType) {
                case "1":
                case "0":
                case "9":
                    return "Building";
                case "2":
                    return "Electrical";
                case "3":
                    return "Plumbing";
                case "4":
                    return "Mechanical";
                case "6":
                    return "Fire";
                default:
                    return "Unknown";
            }
        }
        function Show(id, element, displayType) {
            if (!element) {
                var e = document.getElementById(id);
                if (e.style.display != null) {
                    if (displayType == null)
                        e.style.display = "block";
                    else
                        e.style.display = displayType;
                }
            }
            else {
                var e = document.getElementById(id);
                if (displayType == null)
                    element.style.display = "block";
                else
                    element.style.display = displayType;
            }
        }
        UI.Show = Show;
        function Hide(id) {
            var e = document.getElementById(id);
            if (e)
                e.style.display = "none";
        }
        UI.Hide = Hide;
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
            else if (!isNaN(Number(key)) && key.length > 0 && key.length != 8) {
                message.innerHTML = "\"" + key + "\" is not a valid Permit Number";
            }
            else if (key.length == 0) {
                message.innerHTML = "You did not enter any information.<br />Enter a valid permit number and click search.";
            }
            else {
                message.innerHTML = "Invalid Entry<br />";
            }
            message.style.textAlign = "center";
            e.appendChild(message);
            Hide('Searching');
            Show('SearchFailed');
        }
        function InformUserOfError(permitno, error) {
            var errorbox = document.getElementById('NotScheduled');
            var thisHeading = document.createElement('h5');
            var IssueList = document.createElement('ul');
            var thisIssue = document.createElement('li');
            thisHeading.innerText = "The following issue(s) prevented scheduling the requested inspection:";
            thisHeading.className = "large-12 medium-12 small-12 row";
            errorbox.appendChild(thisHeading);
            thisIssue.textContent = error;
            thisIssue.style.marginLeft = "2rem;";
            IssueList.appendChild(thisIssue);
        }
        UI.InformUserOfError = InformUserOfError;
        function permitSchedulingIssue(key) {
            var InspTypeList = document.getElementById('InspTypeSelect');
            clearElement(InspTypeList);
            var e = document.getElementById('SuspendedPermit');
            clearElement(e);
            var message = document.createElement("h5");
            message.appendChild(document.createTextNode("A new inspection cannot be scheduled for permit #" + key + "."));
            message.appendChild(document.createElement("br"));
            message.appendChild(document.createElement("br"));
            message.appendChild(document.createTextNode("\nPlease contact the Building Department " +
                "for assistance at 904-284-6307.  There are multiple " +
                "reasons an inspection may not " +
                "be scheduled on-line " +
                "(fees due, permit problems, holds, or licensing issues)."));
            e.appendChild(message);
            document.getElementById('SuspendedContractor').style.removeProperty("display");
        }
        function IsGoodCancelDate(inspection, IsExternalUser) {
            var tomorrow = new Date();
            var inspDate = new Date(inspection.DisplaySchedDateTime);
            var dayOfMonth = tomorrow.getDate() + 1;
            //today.setDate( dayOfMonth - 20 );
            if (inspDate < tomorrow && IsExternalUser)
                return false;
            return true;
        }
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map