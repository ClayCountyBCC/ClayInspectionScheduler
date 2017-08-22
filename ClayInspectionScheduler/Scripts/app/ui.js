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
        UI.PermitsWithOutInsp = [];
        function Search(key) {
            clearElement(document.getElementById('SearchFailed'));
            Hide('PermitSelectContainer');
            Hide('CurrentPermitData');
            Hide('CurrentPermit');
            Hide('InspectionTable');
            Hide('SearchFailed');
            Hide('SuspendedContractor');
            Hide('NoInspContainer');
            Hide('NotScheduled');
            Show('Searching');
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
            if (permits.length == 0) {
                UpdateSearchFailed(key);
            }
            else {
                AddPermit(permits, key);
                UpdatePermitData(key, permits);
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
            clearElement(street);
            clearElement(city);
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key; })[0];
            if (permit.URL.length > 0) {
                var streetlink = document.createElement("a");
                streetlink.style.textDecoration = "underline";
                streetlink.href = permit.URL;
                streetlink.appendChild(document.createTextNode(permit.ProjAddrCombined.trim()));
                var citylink = document.createElement("a");
                citylink.style.textDecoration = "underline";
                citylink.href = permit.URL;
                citylink.appendChild(document.createTextNode(permit.ProjCity.trim()));
                street.appendChild(streetlink);
                city.appendChild(citylink);
            }
            else {
                street.appendChild(document.createTextNode(permit.ProjAddrCombined.trim()));
                city.appendChild(document.createTextNode(permit.ProjCity.trim()));
            }
            Show('PermitSelectContainer');
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
            option.appendChild(document.createTextNode(permit.PermitNo + "  (" + label + ")"));
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
            Hide('NoInspContainer');
            Hide('SuspendedContractor');
            clearElement(document.getElementById('InspListData'));
            InspSched.transport.GetInspections(key).then(function (inspections) {
                if (inspections.length > 0) {
                    InspSched.CurrentInspections = inspections;
                    BuildInspectionList(InspSched.CurrentInspections, permit);
                }
                else {
                    // TODO: add 'NO INSPECTIONS ERROR'
                    document.getElementById('NoInspections').style.display = "flex";
                    document.getElementById("InspSched").style.display = "flex";
                    document.getElementById('PermitScreen').style.display = "flex";
                }
                BuildScheduler(InspSched.CurrentInspections, key);
                return true;
            }, function () {
                console.log('error getting inspections');
                return false;
            });
        }
        UI.GetInspList = GetInspList;
        function BuildInspectionList(inspections, permit) {
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var empty = document.createElement("tr");
            // TODO: add Try/Catch
            // create (call BuildInspectioN()) and add inspection row to container InspList
            console.log('inspections', inspections);
            for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                var inspection = inspections_1[_i];
                InspList.appendChild(BuildInspectionRow(inspection));
            }
            InspList.style.removeProperty("display");
            document.getElementById("InspSched").style.removeProperty("display");
            document.getElementById('PermitScreen').style.display = "flex";
        }
        UI.BuildInspectionList = BuildInspectionList;
        // update BuildInspectionRow
        function BuildInspectionRow(inspection) {
            // create variables and get/create document elements
            var inspRow = document.createElement("div");
            var dataColumn = document.createElement("div");
            var remarkrow = document.createElement("div");
            var remarkColumn = document.createElement("div");
            var thisPermit = document.createElement('div');
            var inspDateTime = document.createElement("div");
            var inspDesc = document.createElement("div");
            var inspector = document.createElement("div");
            var InspButtonDiv = document.createElement("div");
            var Remarks = document.createElement("div");
            var ResultADC = document.createElement("div");
            // Set element classes 
            dataColumn.className = "large-10 medium-10 small-12 ";
            remarkColumn.className = "large-10 medium-10 small-12 ";
            if (inspection.ResultADC == null || inspection.ResultADC == "")
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
            else if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
            else if (inspection.ResultADC == 'C')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow";
            else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
                inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";
            thisPermit.className = "large-2 medium-6 small-6 column InspPermit ";
            inspDateTime.className = "large-2 medium-6 small-6 column InspDate";
            inspector.className = "large-3 medium-6 small-12 InspResult column end";
            InspButtonDiv.className = "ButtonContainer large-2 medium-2 small-12 flex-container align-center ";
            Remarks.className = "large-9 medium-6 small-6 inspRemarks column";
            ResultADC.className = "large-3 medium-6 small-6 InspResult column end";
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === inspection.PermitNo; })[0];
            // add the text nodes
            if (!permit.IsExternalUser) {
                var link = document.createElement("a");
                link.style.textDecoration = "underline";
                link.href = "http://claybccims/WATSWeb/Permit/MainBL.aspx?Nav=BL&PermitNo=" + inspection.PermitNo;
                link.appendChild(document.createTextNode(inspection.PermitNo));
                thisPermit.appendChild(link);
            }
            else {
                thisPermit.appendChild(document.createTextNode(inspection.PermitNo));
            }
            if (inspection.DisplayInspDateTime.toLowerCase() == 'incomplete') {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplaySchedDateTime));
            }
            else {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplayInspDateTime));
            }
            inspDesc.appendChild(document.createTextNode(inspection.InsDesc.trim()));
            Remarks.appendChild(document.createTextNode((inspection.Remarks !== null && inspection.Remarks !== "" ? "Remarks: " + inspection.Remarks.trim() : "")));
            ResultADC.appendChild(document.createTextNode(inspection.ResultDescription.trim()));
            inspector.appendChild(document.createTextNode(inspection.InspectorName.trim()));
            //Create function to make New/Cancel Button
            if ((inspection.ResultADC || inspection.DisplaySchedDateTime.length === 0)) {
                var buttonId = "CreateNew_" + inspection.PermitNo;
                if (!document.getElementById(buttonId) && permit.ErrorText.length === 0) {
                    InspButtonDiv.appendChild(BuildButton(buttonId, "New", "InspSched.UpdatePermitSelectList('" + inspection.PermitNo + "');"));
                }
            }
            else if (!inspection.ResultADC) {
                remarkrow.style.display = "none";
                if (IsGoodCancelDate(inspection, InspSched.ThisPermit.IsExternalUser))
                    InspButtonDiv.appendChild(BuildButton("", "Cancel", "InspSched.CancelInspection('" + inspection.InspReqID + "', '" + inspection.PermitNo + "');"));
            }
            dataColumn.appendChild(thisPermit);
            dataColumn.appendChild(inspDateTime);
            dataColumn.appendChild(inspDesc);
            dataColumn.appendChild(inspector);
            inspRow.appendChild(dataColumn);
            inspRow.appendChild(InspButtonDiv);
            inspRow.appendChild(remarkrow);
            if (inspection.DisplayInspDateTime.length > 0) {
                if (inspection.InspReqID !== "99999999") {
                    inspDesc.className = "large-5 medium-6 small-6  InspType column";
                    remarkrow.className = " large-12 medium-12 small-12 row flex-container";
                    remarkColumn.appendChild(Remarks);
                    remarkColumn.appendChild(ResultADC);
                    remarkrow.appendChild(remarkColumn);
                }
                else {
                    inspector.style.display = 'none';
                    inspDateTime.style.display = 'none';
                    inspDesc.className = "large-10 medium-6 small-6 InspType InspResult column";
                }
            }
            return inspRow;
        }
        function BuildButton(buttonId, label, functionCall) {
            var InspButton = document.createElement("button");
            InspButton.id = buttonId;
            InspButton.className = "align-self-center columns NewInspButton";
            InspButton.appendChild(document.createTextNode(label));
            InspButton.setAttribute("onclick", functionCall);
            return InspButton;
        }
        /**********************************************
         *
         * Build Scheduler
         * Get and build select list of inspections@
         *
         *********************************************/
        function BuildScheduler(inspections, key) {
            // Populate Inspection Type Select list
            LoadInspTypeSelect(key);
            InspSched.BuildCalendar(InspSched.ThisPermit.ScheduleDates, InspSched.ThisPermit.ErrorText);
            document.getElementById('InspectionScheduler').setAttribute("value", key);
        }
        UI.BuildScheduler = BuildScheduler;
        function LoadInspTypeSelect(key) {
            var thistype = key[0];
            var label = getInspTypeString(thistype);
            var InspTypeList = document.getElementById('InspTypeSelect');
            var optionLabel = document.createElement("option");
            clearElement(InspTypeList);
            optionLabel.appendChild(document.createTextNode(label + " Inspections:"));
            optionLabel.className = "selectPlaceholder";
            optionLabel.selected;
            optionLabel.value = "";
            InspTypeList.appendChild(optionLabel);
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key; })[0];
            var filteredInspectionTypes = InspSched.InspectionTypes.filter(function (inspectionType) {
                if (inspectionType.InspCd[0] === thistype) {
                    if (permit.NoFinalInspections) {
                        return !inspectionType.Final;
                    }
                    else {
                        return true;
                    }
                }
            });
            //for (let type of InspSched.InspectionTypes)
            for (var _i = 0, filteredInspectionTypes_1 = filteredInspectionTypes; _i < filteredInspectionTypes_1.length; _i++) {
                var type = filteredInspectionTypes_1[_i];
                if (type.InspCd[0] == thistype) {
                    var option = document.createElement("option");
                    option.label = type.InsDesc;
                    option.value = type.InspCd;
                    option.className = "TypeSelectOption";
                    option.appendChild(document.createTextNode(type.InsDesc));
                    InspTypeList.appendChild(option);
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
            Hide("InspectionScheduler");
            clearElement(document.getElementById('InspTypeSelect'));
            var reasons = document.getElementById('Reasons');
            clearElement(reasons);
            var thisHeading = document.getElementById('ErrorHeading');
            clearElement(thisHeading);
            var IssueList = document.createElement('ul');
            var thisIssue = document.createElement('li');
            thisHeading.appendChild(document.createTextNode("The following issue is preventing the ability to schedule an inspection:"));
            thisIssue.appendChild(document.createTextNode(error));
            thisIssue.style.marginLeft = "2rem;";
            IssueList.appendChild(thisIssue);
            reasons.appendChild(IssueList);
            document.getElementById("NotScheduled").style.display = "flex";
        }
        UI.InformUserOfError = InformUserOfError;
        function IsGoodCancelDate(inspection, IsExternalUser) {
            var tomorrow = new Date();
            var inspDate = new Date(inspection.DisplaySchedDateTime);
            var dayOfMonth = tomorrow.getDate() + 1;
            if (inspDate < tomorrow && IsExternalUser)
                return false;
            return true;
        }
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map