var InspSched;
(function (InspSched) {
    var LocationHash // implements ILocationHash
     = (function () {
        function LocationHash(locationHash) {
            this.Permit = "";
            var ha = locationHash.split("&");
            for (var i = 0; i < ha.length; i++) {
                var k = ha[i].split("=");
                switch (k[0].toLowerCase()) {
                    case "permit":
                        this.Permit = k[1];
                        break;
                }
            }
        }
        LocationHash.prototype.update = function (permit) {
            // and using its current properties, going to emit an updated hash
            // with a new EmailId.
            var h = "";
            if (permit.length > 0)
                h += "&permit=" + permit;
            return h.substring(1);
        };
        return LocationHash;
    }());
    InspSched.LocationHash = LocationHash;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=LocationHash.js.map
/// <reference path="app.ts" />
/// <reference path="transport.ts" />
/// <reference path="ui.ts" />
var InspSched;
(function (InspSched) {
    var NewInspection = (function () {
        function NewInspection(PermitNo, InspectionCd, SchecDateTime) {
            this.PermitNo = PermitNo;
            this.InspectionCd = InspectionCd;
            this.SchecDateTime = SchecDateTime;
        }
        return NewInspection;
    }());
    InspSched.NewInspection = NewInspection;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=newinspection.js.map
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
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/*  This code was written by macromaniac
 *  Originally pulled from: https://gist.github.com/macromaniac/e62ed27781842b6c8611 on 7/14/2016
 *  and from https://gist.github.com/takanori-ugai/8262008944769419e614
 *
 */
var XHR;
(function (XHR) {
    var Header = (function () {
        function Header(header, data) {
            this.header = header;
            this.data = data;
        }
        return Header;
    }());
    XHR.Header = Header;
    var Data = (function () {
        function Data() {
        }
        return Data;
    }());
    XHR.Data = Data;
    function DataFromJSXHR(jsXHR) {
        var data = new Data();
        data.Headers = jsXHR.getAllResponseHeaders();
        data.Text = jsXHR.responseText;
        data.Type = jsXHR.responseType;
        data.Status = jsXHR.status;
        data.StatusText = jsXHR.statusText;
        return data;
    }
    function SendCommand(method, url, headers, data) {
        if (data === void 0) { data = ""; }
        return new Promise(function (resolve, reject) {
            var jsXHR = new XMLHttpRequest();
            jsXHR.open(method, url);
            if (headers != null)
                headers.forEach(function (header) {
                    return jsXHR.setRequestHeader(header.header, header.data);
                });
            jsXHR.onload = function (ev) {
                if (jsXHR.status < 200 || jsXHR.status >= 300) {
                    reject(DataFromJSXHR(jsXHR));
                }
                resolve(DataFromJSXHR(jsXHR));
            };
            jsXHR.onerror = function (ev) {
                reject('Error ' + method.toUpperCase() + 'ing data to url "' + url + '", check that it exists and is accessible');
            };
            if (data.length > 0)
                jsXHR.send(data);
            else
                jsXHR.send();
        });
    }
    function addJSONHeader(headers) {
        if (headers === null || headers.length == 0) {
            headers = [
                new XHR.Header("Content-Type", "application/json; charset=utf-8"),
                new XHR.Header("Accept", "application/json")
            ];
        }
        else {
            headers.push(new XHR.Header("Content-Type", "application/json; charset=utf-8"));
            headers.push(new XHR.Header("Accept", "application/json"));
        }
        return headers;
    }
    function Get(url, headers, isJSON) {
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('GET', url, headers);
    }
    XHR.Get = Get;
    function Post(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('POST', url, headers, data);
    }
    XHR.Post = Post;
    function Put(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('PUT', url, headers, data);
    }
    XHR.Put = Put;
    function Delete(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('DELETE', url, headers, data);
    }
    XHR.Delete = Delete;
})(XHR || (XHR = {}));
//# sourceMappingURL=XHR.js.map
/// <reference path="XHR.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var transport;
    (function (transport) {
        "use strict";
        function GetPermit(key) {
            var x = XHR.Get("API/Permit/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var pl = JSON.parse(response.Text);
                    resolve(pl);
                }).catch(function () {
                    console.log("error in GetPermit");
                    reject(null);
                });
            });
        }
        transport.GetPermit = GetPermit;
        function GetInspType() {
            var x = XHR.Get("API/InspType/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var pl = JSON.parse(response.Text);
                    resolve(pl);
                }).catch(function () {
                    console.log("error in GetInspTypeList");
                    reject(null);
                });
            });
        }
        transport.GetInspType = GetInspType;
        function GetInspections(key) {
            var x = XHR.Get("API/Inspection/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var il = JSON.parse(response.Text);
                    resolve(il);
                }).catch(function () {
                    console.log("error in GetInspections");
                    reject(null);
                });
            });
        }
        transport.GetInspections = GetInspections;
        function SaveInspection(thisInspection) {
            var x = XHR.Post("API/NewInspection/", JSON.stringify(thisInspection));
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    InspSched.UI.GetInspList(thisInspection.PermitNo);
                    resolve(di);
                }).catch(function () {
                    console.log("error in SaveInspections");
                    InspSched.UI.GetInspList(thisInspection.PermitNo);
                    reject(null);
                });
            });
        }
        transport.SaveInspection = SaveInspection;
        function CancelInspection(InspID, key) {
            var x = XHR.Delete("API/Inspection/" + key + "/" + InspID);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in GetInspections");
                    reject(null);
                });
            });
        }
        transport.CancelInspection = CancelInspection;
    })(transport = InspSched.transport || (InspSched.transport = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=transport.js.map
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.2+35df15ea
 */

(function () { "use strict"; function t(t) { return "function" == typeof t || "object" == typeof t && null !== t } function e(t) { return "function" == typeof t } function n(t) { G = t } function r(t) { Q = t } function o() { return function () { process.nextTick(a) } } function i() { return function () { B(a) } } function s() { var t = 0, e = new X(a), n = document.createTextNode(""); return e.observe(n, { characterData: !0 }), function () { n.data = t = ++t % 2 } } function u() { var t = new MessageChannel; return t.port1.onmessage = a, function () { t.port2.postMessage(0) } } function c() { return function () { setTimeout(a, 1) } } function a() { for (var t = 0; J > t; t += 2) { var e = tt[t], n = tt[t + 1]; e(n), tt[t] = void 0, tt[t + 1] = void 0 } J = 0 } function f() { try { var t = require, e = t("vertx"); return B = e.runOnLoop || e.runOnContext, i() } catch (n) { return c() } } function l(t, e) { var n = this, r = new this.constructor(p); void 0 === r[rt] && k(r); var o = n._state; if (o) { var i = arguments[o - 1]; Q(function () { x(o, r, i, n._result) }) } else E(n, r, t, e); return r } function h(t) { var e = this; if (t && "object" == typeof t && t.constructor === e) return t; var n = new e(p); return g(n, t), n } function p() { } function _() { return new TypeError("You cannot resolve a promise with itself") } function d() { return new TypeError("A promises callback cannot return that same promise.") } function v(t) { try { return t.then } catch (e) { return ut.error = e, ut } } function y(t, e, n, r) { try { t.call(e, n, r) } catch (o) { return o } } function m(t, e, n) { Q(function (t) { var r = !1, o = y(n, e, function (n) { r || (r = !0, e !== n ? g(t, n) : S(t, n)) }, function (e) { r || (r = !0, j(t, e)) }, "Settle: " + (t._label || " unknown promise")); !r && o && (r = !0, j(t, o)) }, t) } function b(t, e) { e._state === it ? S(t, e._result) : e._state === st ? j(t, e._result) : E(e, void 0, function (e) { g(t, e) }, function (e) { j(t, e) }) } function w(t, n, r) { n.constructor === t.constructor && r === et && constructor.resolve === nt ? b(t, n) : r === ut ? j(t, ut.error) : void 0 === r ? S(t, n) : e(r) ? m(t, n, r) : S(t, n) } function g(e, n) { e === n ? j(e, _()) : t(n) ? w(e, n, v(n)) : S(e, n) } function A(t) { t._onerror && t._onerror(t._result), T(t) } function S(t, e) { t._state === ot && (t._result = e, t._state = it, 0 !== t._subscribers.length && Q(T, t)) } function j(t, e) { t._state === ot && (t._state = st, t._result = e, Q(A, t)) } function E(t, e, n, r) { var o = t._subscribers, i = o.length; t._onerror = null, o[i] = e, o[i + it] = n, o[i + st] = r, 0 === i && t._state && Q(T, t) } function T(t) { var e = t._subscribers, n = t._state; if (0 !== e.length) { for (var r, o, i = t._result, s = 0; s < e.length; s += 3) r = e[s], o = e[s + n], r ? x(n, r, o, i) : o(i); t._subscribers.length = 0 } } function M() { this.error = null } function P(t, e) { try { return t(e) } catch (n) { return ct.error = n, ct } } function x(t, n, r, o) { var i, s, u, c, a = e(r); if (a) { if (i = P(r, o), i === ct ? (c = !0, s = i.error, i = null) : u = !0, n === i) return void j(n, d()) } else i = o, u = !0; n._state !== ot || (a && u ? g(n, i) : c ? j(n, s) : t === it ? S(n, i) : t === st && j(n, i)) } function C(t, e) { try { e(function (e) { g(t, e) }, function (e) { j(t, e) }) } catch (n) { j(t, n) } } function O() { return at++ } function k(t) { t[rt] = at++, t._state = void 0, t._result = void 0, t._subscribers = [] } function Y(t) { return new _t(this, t).promise } function q(t) { var e = this; return new e(I(t) ? function (n, r) { for (var o = t.length, i = 0; o > i; i++) e.resolve(t[i]).then(n, r) } : function (t, e) { e(new TypeError("You must pass an array to race.")) }) } function F(t) { var e = this, n = new e(p); return j(n, t), n } function D() { throw new TypeError("You must pass a resolver function as the first argument to the promise constructor") } function K() { throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.") } function L(t) { this[rt] = O(), this._result = this._state = void 0, this._subscribers = [], p !== t && ("function" != typeof t && D(), this instanceof L ? C(this, t) : K()) } function N(t, e) { this._instanceConstructor = t, this.promise = new t(p), this.promise[rt] || k(this.promise), I(e) ? (this._input = e, this.length = e.length, this._remaining = e.length, this._result = new Array(this.length), 0 === this.length ? S(this.promise, this._result) : (this.length = this.length || 0, this._enumerate(), 0 === this._remaining && S(this.promise, this._result))) : j(this.promise, U()) } function U() { return new Error("Array Methods must be provided an Array") } function W() { var t; if ("undefined" != typeof global) t = global; else if ("undefined" != typeof self) t = self; else try { t = Function("return this")() } catch (e) { throw new Error("polyfill failed because global object is unavailable in this environment") } var n = t.Promise; (!n || "[object Promise]" !== Object.prototype.toString.call(n.resolve()) || n.cast) && (t.Promise = pt) } var z; z = Array.isArray ? Array.isArray : function (t) { return "[object Array]" === Object.prototype.toString.call(t) }; var B, G, H, I = z, J = 0, Q = function (t, e) { tt[J] = t, tt[J + 1] = e, J += 2, 2 === J && (G ? G(a) : H()) }, R = "undefined" != typeof window ? window : void 0, V = R || {}, X = V.MutationObserver || V.WebKitMutationObserver, Z = "undefined" == typeof self && "undefined" != typeof process && "[object process]" === {}.toString.call(process), $ = "undefined" != typeof Uint8ClampedArray && "undefined" != typeof importScripts && "undefined" != typeof MessageChannel, tt = new Array(1e3); H = Z ? o() : X ? s() : $ ? u() : void 0 === R && "function" == typeof require ? f() : c(); var et = l, nt = h, rt = Math.random().toString(36).substring(16), ot = void 0, it = 1, st = 2, ut = new M, ct = new M, at = 0, ft = Y, lt = q, ht = F, pt = L; L.all = ft, L.race = lt, L.resolve = nt, L.reject = ht, L._setScheduler = n, L._setAsap = r, L._asap = Q, L.prototype = { constructor: L, then: et, "catch": function (t) { return this.then(null, t) } }; var _t = N; N.prototype._enumerate = function () { for (var t = this.length, e = this._input, n = 0; this._state === ot && t > n; n++) this._eachEntry(e[n], n) }, N.prototype._eachEntry = function (t, e) { var n = this._instanceConstructor, r = n.resolve; if (r === nt) { var o = v(t); if (o === et && t._state !== ot) this._settledAt(t._state, e, t._result); else if ("function" != typeof o) this._remaining--, this._result[e] = t; else if (n === pt) { var i = new n(p); w(i, t, o), this._willSettleAt(i, e) } else this._willSettleAt(new n(function (e) { e(t) }), e) } else this._willSettleAt(r(t), e) }, N.prototype._settledAt = function (t, e, n) { var r = this.promise; r._state === ot && (this._remaining--, t === st ? j(r, n) : this._result[e] = n), 0 === this._remaining && S(r, this._result) }, N.prototype._willSettleAt = function (t, e) { var n = this; E(t, void 0, function (t) { n._settledAt(it, e, t) }, function (t) { n._settledAt(st, e, t) }) }; var dt = W, vt = { Promise: pt, polyfill: dt }; "function" == typeof define && define.amd ? define(function () { return vt }) : "undefined" != typeof module && module.exports ? module.exports = vt : "undefined" != typeof this && (this.ES6Promise = vt), dt() }).call(this);
/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
var InspSched;
(function (InspSched) {
    "use strict";
    var dpCalendar = null;
    InspSched.InspectionDates = [];
    InspSched.InspectionTypes = [];
    InspSched.GracePeriodDate = "";
    InspSched.CurrentPermits = [];
    InspSched.CurrentInspections = [];
    InspSched.IssuesExist = [];
    var permitscreen = document.getElementById('PermitScreen');
    var InspectionTypeSelect = document.getElementById("InspTypeSelect");
    var PermitSearchButton = document.getElementById("PermitSearchButton");
    var CloseIssueDivButton = document.getElementById("CloseIssueList");
    var PermitSearchField = document.getElementById("PermitSearch");
    var permitNumSelect = document.getElementById("PermitSelect");
    var inspScheduler = document.getElementById("InspectionScheduler");
    var IssueContainer = document.getElementById("NotScheduled");
    var IssuesDiv = document.getElementById('Reasons');
    var SaveInspectionButton = document.getElementById("SaveSchedule");
    var confirmed = document.getElementById('SaveConfirmed');
    function start() {
        LoadData();
        window.onhashchange = HandleHash;
        if (location.hash.substring(1).length > 0)
            HandleHash(); // if they pass something in the URL
    } //  END start()
    InspSched.start = start;
    function updateHash(permit) {
        var hash = new InspSched.LocationHash(location.hash.substring(1));
        location.hash = hash.update(permit);
        var newhash = new InspSched.LocationHash(location.hash.substring(1));
        console.log('newhash', newhash, 'oldhash', hash);
        if (newhash.Permit === hash.Permit) {
            SearchPermit();
        }
    }
    InspSched.updateHash = updateHash;
    function HandleHash() {
        var hash = location.hash;
        var currentHash = new InspSched.LocationHash(location.hash.substring(1));
        if (currentHash.Permit.length > 0) {
            // if they entered a permit number, let's try and search for it
            // do permitsearch here
            PermitSearchField.value = currentHash.Permit.trim();
            SearchPermit();
        }
    }
    InspSched.HandleHash = HandleHash;
    PermitSearchField.onkeydown = function (event) {
        if (event.keyCode == 13) {
            //SearchPermit();
            updateHash(PermitSearchField.value);
        }
    };
    function SearchPermit() {
        permitscreen.style.display = "none";
        InspSched.UI.Hide('SaveConfirmed');
        InspSched.UI.Hide('NotScheduled');
        $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);
        var permitno = PermitSearchField.value.trim();
        InspSched.transport.GetPermit(InspSched.UI.Search(permitno)).then(function (permits) {
            console.log(permits);
            InspSched.CurrentPermits = permits;
            InspSched.UI.ProcessResults(permits, permitno);
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == permitno) {
                    console.log('our permits match');
                    InspSched.ThisPermit = permit;
                    if (permit.ErrorText.length === 0) {
                        console.log('build this calendar, yall');
                        BuildCalendar(permit.ScheduleDates);
                    }
                    else {
                        InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);
                    }
                    break;
                }
            }
            return true;
        }, function () {
            console.log('error getting permits');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            InspSched.UI.Hide('Searching');
            return false;
        });
    }
    InspSched.SearchPermit = SearchPermit;
    permitNumSelect.onchange = function () {
        $(dpCalendar).datepicker('destroy');
        IssueContainer.style.display = 'none';
        confirmed.style.display = "none";
        var permits = InspSched.CurrentPermits;
        // TODO: Add code to check if there is a selected date;
        SaveInspectionButton.setAttribute("disabled", "disabled");
        for (var _i = 0, permits_2 = permits; _i < permits_2.length; _i++) {
            var permit = permits_2[_i];
            if (permit.PermitNo == permitNumSelect.value) {
                InspSched.ThisPermit = permit;
                if (permit.ErrorText.length > 0) {
                    InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);
                }
                else {
                    InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
                    BuildCalendar(permit.ScheduleDates);
                }
                break;
            }
        }
    };
    InspectionTypeSelect.onchange = function () {
        SaveInspectionButton.setAttribute("value", InspectionTypeSelect.value);
        if ($(dpCalendar).data('datepicker').getDate() != null) {
            SaveInspectionButton.removeAttribute("disabled");
        }
    };
    SaveInspectionButton.onclick = function () {
        inspScheduler.style.display = "none";
        confirmed.style.display = "none";
        IssueContainer.style.display = "none";
        InspSched.UI.clearElement(IssuesDiv);
        var thisPermit = permitNumSelect.value;
        var thisInspCd = SaveInspectionButton.getAttribute("value");
        var thisInspDesc = document.getElementById("InspTypeSelect");
        var inspDesc = thisInspDesc.options[thisInspDesc.selectedIndex].textContent;
        InspSched.newInsp = new InspSched.NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate());
        var e = InspSched.transport.SaveInspection(InspSched.newInsp).then(function (issues) {
            var thisHeading = document.getElementById('ErrorHeading');
            var IssueList = document.createElement('ul');
            if (issues.length === 0)
                issues.push("A system error has occurred. Please check your request and try again.");
            if (issues[0].toLowerCase().indexOf("inspection has been scheduled") === -1) {
                InspSched.UI.clearElement(thisHeading);
                thisHeading.appendChild(document.createTextNode("The following issue(s) prevented scheduling the requested inspection:"));
                for (var i in issues) {
                    var thisIssue = document.createElement('li');
                    thisIssue.appendChild(document.createTextNode(issues[i]));
                    thisIssue.style.marginLeft = "2rem;";
                    IssueList.appendChild(thisIssue);
                }
                IssuesDiv.appendChild(IssueList);
                IssueContainer.style.display = "flex";
            }
            else {
                var savesuccess = document.getElementById("SaveSuccess");
                InspSched.UI.clearElement(savesuccess);
                savesuccess.appendChild(document.createTextNode(issues[0]));
                document.getElementById("SaveConfirmed").style.display = "flex";
            }
            return true;
        }, function () {
            console.log('error in Saving Inspection');
            return false;
        });
        if (InspSched.IssuesExist.length > 0)
            IssueContainer.style.display = 'flex';
        InspSched.UI.GetInspList(thisPermit);
    };
    CloseIssueDivButton.onclick = function () {
        IssueContainer.style.display = "none";
    };
    function LoadData() {
        SaveInspectionButton.setAttribute("disabled", "disabled");
        IssueContainer.style.display = "none";
        LoadInspectionTypes();
    }
    function LoadInspectionTypes() {
        InspSched.transport.GetInspType().then(function (insptypes) {
            console.log('inspection types', insptypes);
            InspSched.InspectionTypes = insptypes;
        }, function () {
            console.log('error in LoadInspectionTypes');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            //Hide('Searching');
            InspSched.InspectionTypes = [];
        });
    }
    function BuildCalendar(dates, errorText) {
        if (errorText === void 0) { errorText = ""; }
        $(dpCalendar).datepicker('destroy');
        if (errorText.length === 0) {
            var additionalDisabledDates = GetAdditionalDisabledDates(dates);
            InspSched.InspectionDates = dates;
            InspSched.firstDay = InspSched.InspectionDates[0];
            InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];
            dpCalendar = $('#sandbox-container div').datepicker({
                startDate: InspSched.firstDay,
                datesDisabled: additionalDisabledDates,
                endDate: InspSched.lastDay,
                maxViewMode: 0,
                toggleActive: true,
            });
            {
                $(dpCalendar).on('changeDate', function () {
                    var date = $(dpCalendar).data('datepicker').getDate();
                    //return false;
                    $('change-date').submit();
                    EnableSaveButton();
                });
            }
            ;
            document.getElementById('InspectionScheduler').style.display = "flex";
        }
    }
    InspSched.BuildCalendar = BuildCalendar;
    function EnableSaveButton() {
        {
            if (InspectionTypeSelect.value != "" && $(dpCalendar).data('datepicker').getDate() != null) {
                SaveInspectionButton.removeAttribute("disabled");
            }
            else {
                SaveInspectionButton.setAttribute("disabled", "disabled");
            }
        }
    }
    function GetAdditionalDisabledDates(dates) {
        var AdditionalDisabledDates = [];
        if (dates.length > 2) {
            for (var d = 1; d < dates.length - 1; d++) {
                AdditionalDisabledDates.push(dates[d]);
            }
        }
        return AdditionalDisabledDates;
    }
    function UpdatePermitSelectList(PermitNo) {
        document.getElementById("NotScheduled").style.display = "none";
        document.getElementById("SaveConfirmed").style.display = "none";
        var selectedoption = document.getElementById("select_" + PermitNo);
        selectedoption.selected = true;
        for (var _i = 0, _a = InspSched.CurrentPermits; _i < _a.length; _i++) {
            var permit = _a[_i];
            if (permit.PermitNo == permitNumSelect.value) {
                InspSched.ThisPermit = permit;
                InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
                InspSched.UI.BuildScheduler(InspSched.CurrentInspections, permit.PermitNo);
            }
        }
        if ($('#sandbox-container div').data('datepicker') != null && $('#sandbox-container div').data('datepicker') != undefined)
            $('#sandbox-container div').data('datepicker').clearDates();
        $('#InspectionSchedulerTabs').foundation('selectTab', 'Scheduler', true);
        // clears Calendar of any chosen dates
    }
    InspSched.UpdatePermitSelectList = UpdatePermitSelectList;
    function CancelInspection(InspID, PermitNo) {
        document.getElementById('NotScheduled').style.display = "none";
        if (InspID != null && PermitNo != null) {
            //Hide( 'FutureInspRow' );
            // TODO: Add function to not allow cancel if scheduled date of insp is current date 
            var isDeleted = InspSched.transport.CancelInspection(InspID, PermitNo);
            // TODO: ADD code to inform user if the inspection has been deleted 
            // Reload inspection list after delete
            if (isDeleted) {
                InspSched.UI.GetInspList(PermitNo);
                BuildCalendar(InspSched.ThisPermit.ScheduleDates);
            }
            else {
                //display notification of failed delete
            }
        }
    }
    InspSched.CancelInspection = CancelInspection;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map