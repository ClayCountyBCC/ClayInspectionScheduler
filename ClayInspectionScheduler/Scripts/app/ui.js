/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var UI;
    (function (UI) {
        UI.CurrentPermits = new Array();
        UI.CurrentInspections = [];
        UI.PermitsWithOutInsp = [];
        UI.CurrentDetailsOpen = "";
        function Search(key) {
            clearElement(document.getElementById('SearchFailed'));
            Hide('PermitSelectContainer');
            Hide('CurrentPermitData');
            Hide('CurrentPermit');
            Hide('InspectionTable');
            Hide('SearchFailed');
            Hide('SuspendedContractor');
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
                document.getElementById('CurrentPermitData').style.display = "flex";
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
                    InspSched.ThisPermit = permit;
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
            street.appendChild(document.createTextNode(permit.ProjAddrCombined != null ? permit.ProjAddrCombined.trim() : "UNKNOWN"));
            if (permit.ProjCity != null) {
                city.appendChild(document.createTextNode(permit.ProjCity.trim()));
            }
            Show('PermitSelectContainer');
        }
        UI.UpdatePermitData = UpdatePermitData;
        function buildPermitSelectOptGroup(lbl, val) {
            //let og = document.createElement( "optgroup" );
            var og = document.createElement("optgroup");
            og.label = lbl;
            //og.value = val;
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
                    document.getElementById('InspectionTable').style.display = "flex";
                }
                BuildScheduler(InspSched.CurrentInspections, key);
                // This is how we auto select an inspection when one is passed from the inspection view.
                if (InspSched.CurrentPermits[0].access !== InspSched.access_type.public_access) {
                    var hash = new InspSched.LocationHash(location.hash.substring(1));
                    if (hash.InspectionId > 0) {
                        InspSched.UI.ToggleInspDetails(hash.InspectionId.toString());
                    }
                }
                return true;
            }, function () {
                console.log('error getting inspections');
                return false;
            });
        }
        UI.GetInspList = GetInspList;
        function BuildInspectionList(inspections, permit) {
            //For testing ONLY
            // Initialize element variable for list container 'InspListData'
            var InspList = document.getElementById('InspListData');
            var empty = document.createElement("tr");
            // TODO: add Try/Catch
            // create (call BuildInspectioN()) and add inspection row to container InspList
            console.log('inspections', inspections);
            for (var _i = 0, inspections_1 = inspections; _i < inspections_1.length; _i++) {
                var inspection = inspections_1[_i];
                if (permit) {
                    if (permit.access === InspSched.access_type.public_access) {
                        inspection.Comment = "";
                    }
                }
                InspList.appendChild(BuildInspectionRow(inspection));
            }
            InspList.style.removeProperty("display");
            document.getElementById("InspSched").style.removeProperty("display");
            document.getElementById('InspectionTable').style.display = "flex";
        }
        UI.BuildInspectionList = BuildInspectionList;
        // update BuildInspectionRow
        function BuildInspectionRow(inspection) {
            //let BrowserName = CheckBrowser();
            var permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === inspection.PermitNo; })[0];
            var inspRow = CreateNewHTMLElement("div", "InspRow large-12 medium-12 small-12 row flex-container align-middle");
            inspRow.classList.add(AddRowClass(inspection.ResultADC));
            // TODO: create function CreateNewDivRow(elementType: string, classList: string){   }
            // #region DataRows
            //*******************************************************************************************
            var DataRow = CreateNewHTMLElement("div", "large-12 medium-12 small-12 row flex-container align-middle");
            var inspectionData = CreateNewHTMLElement("div", "large-10 medium-8 small-12");
            var permitNumber = CreateNewHTMLElement("div", "large-2 medium-6 small-6 column InspPermit ");
            var inspDesc = CreateNewHTMLElement("div", "large-5 medium-6 small-6 InspType column");
            inspDesc.appendChild(document.createTextNode(inspection.InsDesc.trim()));
            var inspDateTime = CreateNewHTMLElement("div", "large-2 medium-6 small-6 column InspDate");
            inspDateTime.id = inspection.InspReqID.toString() + "_inspection-date-time";
            var inspector = CreateNewHTMLElement("div", "large-3 medium-6 small-12 InspResult column end");
            inspector.appendChild(document.createTextNode(inspection.InspectorName.trim()));
            //********************************************
            var InspButtonContainer = CreateNewHTMLElement("div", "ButtonContainer column large-2 medium-4 small-12 flex-container align-center");
            // #endregion
            //
            // #region Completed Remarks Row
            //*******************************************************************************************
            var DetailsContainer = CreateNewHTMLElement("div", "large-12 medium-12 small-12 row flex-container align-middle details-container");
            //*********************************************
            var CompletedRemarks = CreateNewHTMLElement("div", "large-12 medium-12 small-12 row");
            CompletedRemarks.id = inspection.InspReqID.toString() + "_completed_remark";
            CompletedRemarks.style.display = "flex";
            var Remark = CreateNewHTMLElement("div", "large-12 medium-12 small-12 row flex-container align-middle details-container");
            Remark.className = "column large-9 medium-6 small-6 inspRemarks";
            //Remark.setAttribute("elementName", "Remark");
            Remark.id = inspection.InspReqID.toString() + "_completed_remark_text";
            Remark.appendChild(document.createTextNode((inspection.Remarks !== null && inspection.Remarks !== "" ? inspection.Remarks.trim() : "")));
            var ResultDescription = CreateNewHTMLElement("div", "large-3 medium-6 small-6 InspResult column end");
            ResultDescription.appendChild(document.createTextNode(inspection.ResultDescription.trim()));
            ResultDescription.id = inspection.InspReqID + "_inspection_resultADC";
            // #endregion
            var addRemarkContainer = CreateNewHTMLElement("div", "large-12 medium-12 small-12 row flex-container align-middle add-remark-container");
            addRemarkContainer.id = inspection.InspReqID + "_add_remark";
            addRemarkContainer.style.display = "none";
            var addRemark = CreateNewHTMLElement("div", "row large-12 medium-12 small-12 flex-container flex-child-grow");
            var addRemarkLabel = document.createElement("label");
            addRemarkLabel.className = "large-12 medium-12 small-12 row ";
            addRemarkLabel.textContent = "Public Remarks:";
            addRemarkLabel.style.textAlign = "left";
            var addRemarkTextDiv = document.createElement("div");
            addRemarkTextDiv.className = "large-10 medium-8 small-12";
            addRemarkTextDiv.classList.add("flex-container");
            var addRemarkInputGroup = document.createElement("div");
            addRemarkInputGroup.classList.add("input-group");
            addRemarkInputGroup.classList.add("small-12");
            addRemarkInputGroup.style.margin = "0";
            var remarkInput = document.createElement("textarea");
            remarkInput.setAttribute("onkeyup", "InspSched.disableSaveCommentButton(" + inspection.InspReqID + ")");
            remarkInput.id = inspection.InspReqID + "_remark_textarea";
            remarkInput.setAttribute("wrap", "soft");
            remarkInput.style.margin = "0";
            remarkInput.style.minHeight = "80px";
            remarkInput.style.resize = "vertical";
            remarkInput.setAttribute("overflow-wrap", "break-word");
            remarkInput.setAttribute("word-wrap", "break-word");
            if (inspection.Remarks) {
                remarkInput.appendChild(document.createTextNode(inspection.Remarks));
            }
            //remarkInput.classList.add("input-group-field");
            remarkInput.classList.add("columns");
            remarkInput.classList.add("word-wrap");
            var containerSpan = document.createElement("span");
            containerSpan.classList.add("input-group-button");
            var quickRemarkUL = document.createElement("UL");
            var quickRemarkButton = document.createElement("button");
            quickRemarkButton.classList.add("button");
            quickRemarkButton.classList.add("dropdown");
            quickRemarkButton.classList.add("arrow-only");
            quickRemarkButton.style.borderLeftWidth = "0";
            quickRemarkButton.classList.add("end");
            var handler = function handleScrollForRealThisTime() {
                quickRemarkUL.style.display = "none";
                eventTarget.removeEventListener("scroll", handler, false);
                window.removeEventListener("resize", handler, true);
            };
            quickRemarkButton.onclick = function (e) {
                var toggle = quickRemarkUL.style.display === "block";
                if (!toggle) {
                    eventTarget.addEventListener("scroll", handler, false);
                    window.addEventListener("resize", handler, true);
                    var remarkInput_1 = document.getElementById(inspection.InspReqID + "_remark_textarea");
                    quickRemarkUL.style.display = toggle ? "none" : "block";
                    quickRemarkUL.style.width = addRemarkInputGroup.clientWidth.toString() + "px";
                    quickRemarkUL.style.maxWidth = addRemarkInputGroup.clientWidth.toString() + "px";
                    quickRemarkUL.style.left = addRemarkInputGroup.offsetLeft.toString();
                    var windowHeight = window.innerHeight;
                    var bottomHeight = windowHeight - (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop);
                    var topHeight = addRemarkInputGroup.offsetTop - eventTarget.scrollTop;
                    var leftOffset = addRemarkInputGroup.offsetLeft;
                    console.log('windowHeight: ', windowHeight, 'bottomHeight: ', bottomHeight, 'topHeight: ', topHeight);
                    quickRemarkUL.style.height = "103px";
                    if (bottomHeight < topHeight) {
                        console.log('use top');
                        quickRemarkUL.style.top = (topHeight - 103).toString() + "px";
                        quickRemarkUL.style.left = leftOffset.toString() + "px";
                    }
                    else {
                        console.log('use bottom');
                        quickRemarkUL.style.top = (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop).toString() + "px";
                        quickRemarkUL.style.left = leftOffset.toString() + "px";
                    }
                }
                else {
                    handler();
                }
            };
            quickRemarkUL.id = "drop" + inspection.InspReqID.toString();
            quickRemarkUL.classList.add("quick-remark-list");
            quickRemarkUL.classList.add("row");
            quickRemarkUL.style.backgroundColor = "white";
            quickRemarkUL.style.display = "none";
            quickRemarkUL.style.position = "fixed";
            var filteredRemarks = InspSched.FilterQuickRemarks(inspection.PermitNo[0], inspection.PrivateProviderInspectionRequestId > 0);
            var _loop_1 = function (qr) {
                var quickRemarkLi = document.createElement("LI");
                var link_1 = document.createElement("a");
                link_1.onclick = function (e) {
                    return InspSched.UI.SetRemarkText(inspection.InspReqID, qr.Remark);
                };
                link_1.appendChild(document.createTextNode(qr.Remark));
                quickRemarkLi.appendChild(link_1);
                quickRemarkUL.appendChild(quickRemarkLi);
            };
            for (var _i = 0, filteredRemarks_1 = filteredRemarks; _i < filteredRemarks_1.length; _i++) {
                var qr = filteredRemarks_1[_i];
                _loop_1(qr);
            }
            containerSpan.appendChild(quickRemarkButton);
            addRemarkInputGroup.appendChild(remarkInput);
            addRemarkInputGroup.appendChild(containerSpan);
            var eventTarget = document.getElementById("ScrollTab");
            var addRemarkButtonDiv = CreateNewHTMLElement("div", "row large-12 medium-12 small-12 flex-container flex-child-grow");
            var addRemarkButton = document.createElement("button");
            var radioButtonSection = document.createElement("div");
            var CommentContainer = document.createElement("div");
            var textboxdiv = document.createElement("div");
            var thiscomment = document.createElement("textarea");
            var AddCommentDiv = document.createElement("div");
            var commentlabel = document.createElement("label");
            var AddCommentTextarea = document.createElement("textarea");
            var SaveCommentButtonDiv = document.createElement("div");
            var SaveCommentButton = document.createElement("button");
            if (1 == 1) {
                // #region add Remarks Container: add Remarks textarea, button, and radiobutton sections
                //*******************************************************************************
                //addRemarkContainer.setAttribute("elementName", "addRemarkContainer");
                //***************************************
                quickRemarkButton.classList.add("button");
                quickRemarkButton.classList.add("dropdown");
                quickRemarkButton.classList.add("arrow-only");
                quickRemarkButton.style.borderLeftWidth = "0";
                quickRemarkButton.classList.add("end");
                var handler_1 = function handleScrollForRealThisTime() {
                    quickRemarkUL.style.display = "none";
                    eventTarget.removeEventListener("scroll", handler_1, false);
                    window.removeEventListener("resize", handler_1, true);
                };
                quickRemarkButton.onclick = function (e) {
                    var toggle = quickRemarkUL.style.display === "block";
                    if (!toggle) {
                        eventTarget.addEventListener("scroll", handler_1, false);
                        window.addEventListener("resize", handler_1, true);
                        var remarkInput_2 = document.getElementById(inspection.InspReqID + "_remark_textarea");
                        quickRemarkUL.style.display = toggle ? "none" : "block";
                        quickRemarkUL.style.width = addRemarkInputGroup.clientWidth.toString() + "px";
                        quickRemarkUL.style.maxWidth = addRemarkInputGroup.clientWidth.toString() + "px";
                        quickRemarkUL.style.left = addRemarkInputGroup.offsetLeft.toString();
                        var windowHeight = window.innerHeight;
                        var bottomHeight = windowHeight - (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop);
                        var topHeight = addRemarkInputGroup.offsetTop - eventTarget.scrollTop;
                        var leftOffset = addRemarkInputGroup.offsetLeft;
                        console.log('windowHeight: ', windowHeight, 'bottomHeight: ', bottomHeight, 'topHeight: ', topHeight);
                        quickRemarkUL.style.height = "103px";
                        if (bottomHeight < topHeight) {
                            console.log('use top');
                            quickRemarkUL.style.top = (topHeight - 103).toString() + "px";
                            quickRemarkUL.style.left = leftOffset.toString() + "px";
                        }
                        else {
                            console.log('use bottom');
                            quickRemarkUL.style.top = (addRemarkInputGroup.offsetTop + addRemarkInputGroup.clientHeight - eventTarget.scrollTop).toString() + "px";
                            quickRemarkUL.style.left = leftOffset.toString() + "px";
                        }
                    }
                    else {
                        handler_1();
                    }
                };
                quickRemarkUL.id = "drop" + inspection.InspReqID.toString();
                quickRemarkUL.classList.add("quick-remark-list");
                quickRemarkUL.classList.add("row");
                quickRemarkUL.style.backgroundColor = "white";
                quickRemarkUL.style.display = "none";
                quickRemarkUL.style.position = "fixed";
                var filteredRemarks_3 = InspSched.FilterQuickRemarks(inspection.PermitNo[0], inspection.PrivateProviderInspectionRequestId > 0);
                var _loop_2 = function (qr) {
                    var quickRemarkLi = document.createElement("LI");
                    var link_2 = document.createElement("a");
                    link_2.onclick = function (e) {
                        return InspSched.UI.SetRemarkText(inspection.InspReqID, qr.Remark);
                    };
                    link_2.appendChild(document.createTextNode(qr.Remark));
                    quickRemarkLi.appendChild(link_2);
                    quickRemarkUL.appendChild(quickRemarkLi);
                };
                for (var _a = 0, filteredRemarks_2 = filteredRemarks_3; _a < filteredRemarks_2.length; _a++) {
                    var qr = filteredRemarks_2[_a];
                    _loop_2(qr);
                }
                containerSpan.appendChild(quickRemarkButton);
                addRemarkInputGroup.appendChild(remarkInput);
                addRemarkInputGroup.appendChild(containerSpan);
                //addRemarkButtonDiv.setAttribute("elementName", "addRemarkButtonDiv");
                addRemarkButtonDiv.className = "ButtonContainer column large-2 medium-4 small-12 flex-container align-center flex-child-grow";
                //addRemarkButton.setAttribute("elementName", "addRemarkButton");
                addRemarkButton.setAttribute("disabled", "disabled");
                addRemarkButton.setAttribute("value", inspection.ResultADC);
                addRemarkButton.id = inspection.InspReqID + "_save_remark_button";
                addRemarkButton.setAttribute("onclick", "InspSched.UpdateInspection('" + permit.PermitNo + "', " + inspection.InspReqID + ")");
                addRemarkButton.className = "align-self-center columns DetailsButton large-12 medium-12-small-12";
                addRemarkButton.style.margin = "0";
                addRemarkButton.textContent = "Save Result";
                //***************************************
                //radioButtonSection.setAttribute("elementName", "radioButtonSection");
                radioButtonSection.className = "large-12 medium-12 small-12 column";
                radioButtonSection.style.paddingLeft = "1em";
                // #endregion Remarks Container: add Remarks textarea, button, and radiobutton sections
                // #region Comment Section
                //*********************************************************************************
                CommentContainer.className = "large-12 medium-12 small-12 row flex-container comment-container completed-comments-textarea";
                //CommentContainer.setAttribute("elementName", "CommentContainer");
                CommentContainer.style.display = "none";
                CommentContainer.id = inspection.InspReqID + "_comments";
                //textboxdiv.setAttribute("elementName", "textboxdiv");
                textboxdiv.className = "large-12 medium-12 small-12 row completed-comments-textarea ";
                textboxdiv.style.display = "none";
                textboxdiv.id = inspection.InspReqID.toString() + "_textbox_div";
                //thiscomment.setAttribute("elementName", "thiscomment");
                thiscomment.id = inspection.InspReqID + "_audit";
                thiscomment.className = "row large-12 medium-12 small-12 No-Edit";
                thiscomment.rows = 4;
                thiscomment.readOnly = true;
                thiscomment.contentEditable = "false";
                thiscomment.style.margin = "0";
                thiscomment.style.overflowY = "scroll";
                thiscomment.style.display = "flex";
                //AddCommentDiv.setAttribute("elementName", "AddCommentDiv");
                AddCommentDiv.className = "row large-12 medium-12 small-12 flex-container flex-child-grow";
                AddCommentDiv.style.paddingLeft = "1em";
                //commentlabel.setAttribute("elementName", "commentlabel");
                commentlabel.className = "large-12 medium-12 small-12 row ";
                commentlabel.style.textAlign = "left";
                commentlabel.innerText = "Add Comments:";
                //AddCommentTextarea.setAttribute("elementName", "AddCommentTextarea");
                AddCommentTextarea.className = "large-10 medium-10 small-12 column Comment-Textarea";
                AddCommentTextarea.style.resize = "none";
                AddCommentTextarea.rows = 3;
                AddCommentTextarea.id = inspection.InspReqID + "_comment_textarea";
                AddCommentTextarea.maxLength = 200;
                //SaveCommentButtonDiv.setAttribute("elementName", "SaveCommentuttonDiv");
                SaveCommentButtonDiv.className = "ButtonContainer column large-2 medium-2 small-12 flex-container align-center";
                SaveCommentButton.className = "button align-self-center column small-12 SaveCommentButton";
                //SaveCommentButton.setAttribute("elementName", "SaveCommentButton");
                SaveCommentButton.setAttribute("onclick", "InspSched.SaveComment('" + inspection.InspReqID + "','" + AddCommentTextarea.value + "')");
                SaveCommentButton.textContent = "Save Comment";
                SaveCommentButton.id = inspection.InspReqID + "_save_comment_button";
                //if (inspection.comments.length > 0)
                //{
                //  CommentContainer.appendChild(1234567_textboxdiv);
                //}
                //1234567_commnents.appendChild(AddCommentDiv);
                //AddCommentDiv.appendChild(commentlabel);
                //AddCommentDiv.appendChild(AddCommentTextarea);
                //SaveCommentButtonDiv.appendChild(SaveCommentButton)
                //AddCommentDiv.appendChild(SaveCommentButtonDiv);
            }
            // #endregion Comment Secion
            //*********************************************
            // Set permit number as link to IMS if internal user and public permit search
            var link = document.createElement("a");
            if (permit.access !== InspSched.access_type.public_access && permit.access !== InspSched.access_type.contract_access) {
                link.href = permit.Permit_URL;
                //permit.Permit_URL.substring()
            }
            else {
                link.href = "//public.claycountygov.com/permitsearch/#tab=permit&sortfield=issuedate&sortdirection=D&permitnumber=" + permit.PermitNo + "&status=all&page=1&v=0";
            }
            link.target = "_blank";
            link.rel = "noopen";
            link.classList.add('no-underline-for-print');
            link.appendChild(document.createTextNode(inspection.PermitNo));
            permitNumber.appendChild(link);
            // if inspection is incomplete, set date to InspSched, else InspDate
            if (inspection.DisplayInspDateTime.toLowerCase() === 'scheduled') {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplaySchedDateTime));
            }
            else {
                inspDateTime.appendChild(document.createTextNode(inspection.DisplayInspDateTime));
            }
            // #region Initial Append Rows to Inspection Row
            inspectionData.appendChild(permitNumber);
            inspectionData.appendChild(inspDateTime);
            inspectionData.appendChild(inspDesc);
            inspectionData.appendChild(inspector);
            DataRow.appendChild(inspectionData);
            inspRow.appendChild(DataRow);
            if (permit.access != InspSched.access_type.public_access &&
                (InspSched.CanResultBeChanged(inspection.InspDateTime) ||
                    inspection.ResultADC == "" ||
                    inspection.ResultADC == null)) {
                addRemarkTextDiv.appendChild(addRemarkInputGroup);
                addRemarkTextDiv.appendChild(quickRemarkUL);
                addRemarkButtonDiv.appendChild(addRemarkButton);
                addRemark.appendChild(addRemarkLabel);
                addRemark.appendChild(addRemarkTextDiv);
                addRemark.appendChild(addRemarkButtonDiv);
                addRemarkContainer.appendChild(addRemark);
                radioButtonSection.appendChild(BuildRadioButtonRow(inspection.InspReqID.toString(), inspection.ResultADC, permit.access, inspection.PrivateProviderInspectionRequestId));
                addRemarkContainer.appendChild(radioButtonSection);
            }
            // #endregion Initial Append Rows to Inspection Row
            var detailButton = BuildButton(inspection.InspReqID + "_details_btn", "Details", "InspSched.UI.ToggleInspDetails(this.value)", inspection.InspReqID.toString());
            detailButton.className = "column large-12 medium-12 small-12 align-self-center  DetailsButton";
            var buttonDiv = document.createElement("div");
            buttonDiv.className = "row small-12";
            InspButtonContainer.appendChild(buttonDiv);
            var DoesInspectorCheckOut = false;
            if (InspSched.Inspectors.length > 0) {
                DoesInspectorCheckOut =
                    (InspSched.UserIsContractInspector &&
                        inspection.InspectorName.toLocaleLowerCase().substr(0, InspSched.Inspectors[0].Name.length) ==
                            InspSched.Inspectors[0].Name.toLowerCase());
            }
            var newButtonExists = document.getElementById((inspection.InspReqID == 0 ? inspection.PermitNo : inspection.InspReqID) + "_newButton");
            //Create function to make New/Cancel/Details Button
            if (permit.ErrorText.length === 0) {
                if (newButtonExists == null && (!InspSched.UserIsContractInspector || DoesInspectorCheckOut)) {
                    var newButton = BuildButton("", "New", "InspSched.UpdatePermitSelectList('" + inspection.PermitNo + "');");
                    newButton.id = (inspection.InspReqID == 0 ? inspection.PermitNo : inspection.InspReqID) + "_newButton";
                    buttonDiv.appendChild(newButton);
                }
            }
            else {
                detailButton.style.margin = "0";
            }
            if (permit.access !== InspSched.access_type.public_access) {
                if (inspection.InspReqID !== 0) {
                    if (!InspSched.UserIsContractInspector || DoesInspectorCheckOut) {
                        buttonDiv.appendChild(detailButton);
                    }
                }
            }
            if (inspection.ResultADC.length == 0) {
                if (IsGoodCancelDate(inspection, permit.access)) {
                    if (permit.access === InspSched.access_type.public_access) {
                        var privprovstring = permit.ErrorText.substr(2, 16).toLowerCase();
                        if (privprovstring != "private provider" || inspection.PrivateProviderInspectionRequestId != null) {
                            var cancelButton = BuildButton("", "Cancel", "InspSched.CancelInspection(" + inspection.InspReqID + ", '" + inspection.PermitNo + "');");
                            if (newButtonExists == null) {
                                cancelButton.style.marginTop = "5px";
                            }
                            buttonDiv.appendChild(cancelButton);
                        }
                    }
                    else {
                        if (inspection.InspReqID !== 0) {
                            if (!InspSched.UserIsContractInspector || DoesInspectorCheckOut) {
                                buttonDiv.appendChild(detailButton);
                            }
                        }
                    }
                }
            }
            DataRow.appendChild(InspButtonContainer);
            if (inspection.DisplayInspDateTime.length > 0) {
                if (inspection.InspReqID > 0) {
                    CompletedRemarks.appendChild(Remark);
                    CompletedRemarks.appendChild(ResultDescription);
                    // remarks needs to be in the inspection data
                    inspectionData.appendChild(CompletedRemarks);
                }
                else {
                    inspector.style.display = 'none';
                    inspDateTime.style.display = 'none';
                    inspDesc.className = "large-10 medium-6 small-6 InspType InspResult column";
                }
            }
            CommentContainer.appendChild(textboxdiv);
            // SET COMMENTS
            if (inspection.Comment.length > 0) {
                thiscomment.textContent = inspection.Comment;
                textboxdiv.style.display = "flex";
                thiscomment.style.display = "flex";
            }
            textboxdiv.appendChild(thiscomment);
            CommentContainer.appendChild(textboxdiv);
            AddCommentDiv.appendChild(commentlabel);
            AddCommentDiv.appendChild(AddCommentTextarea);
            SaveCommentButtonDiv.appendChild(SaveCommentButton);
            AddCommentDiv.appendChild(SaveCommentButtonDiv);
            CommentContainer.appendChild(AddCommentDiv);
            if (permit.access !== InspSched.access_type.public_access) {
                DetailsContainer.appendChild(addRemarkContainer);
                DetailsContainer.appendChild(CommentContainer);
            }
            inspRow.appendChild(DetailsContainer);
            return inspRow;
        }
        //function CheckBrowser()
        //{
        //  let browser: string = "";
        //  if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) 
        //  {
        //    browser = 'Opera';
        //  }
        //  else if (navigator.userAgent.indexOf("Chrome") != -1)
        //  {
        //    browser = 'Chrome';
        //  }
        //  else if (navigator.userAgent.indexOf("Safari") != -1)
        //  {
        //    browser = 'Safari';
        //  }
        //  else if (navigator.userAgent.indexOf("Firefox") != -1) 
        //  {
        //    browser = 'Firefox';
        //  }
        //  else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) //IF IE > 10
        //  {
        //    browser = 'IE';
        //  }
        //  else 
        //  {
        //    browser = 'unknown';
        //  }
        //  return browser;
        //}
        function CreateNewHTMLElement(element, classList) {
            var newElement = document.createElement(element);
            if (classList != undefined)
                newElement.className = classList;
            return newElement;
        }
        function AddRowClass(result) {
            switch (result) {
                case 'A':
                case 'P':
                    return "PassRow";
                case 'C':
                    return "CancelRow";
                case 'F':
                case 'D':
                case 'N':
                    return "FailRow";
            }
        }
        function BuildButton(buttonId, label, functionCall, value) {
            var InspButton = document.createElement("button");
            if (buttonId.length > 0) {
                InspButton.id = buttonId;
            }
            InspButton.value = "";
            InspButton.className = "column large-12 medium-12 small-12 align-self-center  NewInspButton";
            InspButton.appendChild(document.createTextNode(label));
            InspButton.setAttribute("onclick", functionCall);
            InspButton.value = (value == null ? "" : value);
            return InspButton;
        }
        function BuildRadioButtonRow(InspectionId, checked, access, privateProvidercheck) {
            var RadioButtonSubrow = document.createElement("div");
            if (access == InspSched.access_type.inspector_access || access == InspSched.access_type.contract_access) {
                RadioButtonSubrow.className = "small-12 flex-container flex-child-grow row";
                RadioButtonSubrow.id = InspectionId + "_radio_list";
                var approveradio = document.createElement("input");
                approveradio.id = (privateProvidercheck > 0 ? "perform" : "approve") + "_selection";
                approveradio.type = "radio";
                approveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
                if (checked == "A" || checked == "P") {
                    approveradio.checked = true;
                }
                approveradio.name = InspectionId + "_results";
                approveradio.value = (privateProvidercheck > 0 ? "P" : "A");
                var approve = document.createElement("label");
                approve.className = "column large-2 small-6 ";
                approve.appendChild(approveradio);
                approve.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Performed" : "Approved"));
                var disapproveradio = document.createElement("input");
                disapproveradio.id = (privateProvidercheck > 0 ? "not_performed" : "disapprove") + "_selection";
                disapproveradio.type = "radio";
                disapproveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
                if (checked == "D" || checked == "N") {
                    disapproveradio.checked = true;
                }
                disapproveradio.name = InspectionId + "_results";
                disapproveradio.value = (privateProvidercheck > 0 ? "N" : "D");
                var disapprove = document.createElement("label");
                disapprove.className = "column large-2 small-6 ";
                disapprove.appendChild(disapproveradio);
                disapprove.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Not Performed" : "Disapproved"));
                RadioButtonSubrow.appendChild(approve);
                RadioButtonSubrow.appendChild(disapprove);
            }
            else {
                RadioButtonSubrow.className = "large-10 medium-10 small-12 flex-container flex-dir-row flex-child-grow align-right";
            }
            var cancelradio = document.createElement("input");
            cancelradio.id = "cancelradio_selection";
            cancelradio.type = "radio";
            cancelradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
            if (checked == "C") {
                cancelradio.checked = true;
            }
            cancelradio.name = InspectionId + "_results";
            cancelradio.value = "C";
            var cancel = document.createElement("label");
            cancel.className = "column large-2 small-6";
            cancel.appendChild(cancelradio);
            cancel.appendChild(document.createTextNode("Cancel"));
            var incompleteradio = document.createElement("input");
            incompleteradio.id = "incompleteradio_selection";
            incompleteradio.type = "radio";
            incompleteradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
            if (checked == "") {
                incompleteradio.checked = true;
            }
            incompleteradio.name = InspectionId + "_results";
            incompleteradio.value = "";
            var incomplete = document.createElement("label");
            incomplete.className = "column large-2 small-6 end";
            incomplete.appendChild(incompleteradio);
            incomplete.appendChild(document.createTextNode("Incomplete"));
            RadioButtonSubrow.appendChild(cancel);
            RadioButtonSubrow.appendChild(incomplete);
            return RadioButtonSubrow;
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
            InspSched.UI.SetAndShowContractorWarning();
            document.getElementById('InspectionScheduler').setAttribute("value", key);
        }
        UI.BuildScheduler = BuildScheduler;
        function LoadInspTypeSelect(key) {
            var permitType = key[0];
            var label = getInspTypeString(permitType);
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
                if (permitType == "9" || permitType == "0") {
                    permitType = "1";
                }
                if (inspectionType.InspCd[0] == permitType) {
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
                if (type.InspCd[0] == permitType) {
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
        function SetAndShowContractorWarning() {
            var NoticeArea = document.getElementById("contractor_notice");
            var warningArea = document.getElementById("contractor_notice_list");
            console.log("Inside SetAndShowContractorWarning();", UI.CurrentPermits);
            clearElement(warningArea);
            var isNotice = false;
            for (var _i = 0, _a = InspSched.CurrentPermits; _i < _a.length; _i++) {
                var p = _a[_i];
                if (p.ContractorWarning.length > 0 && p.ErrorText.length == 0) {
                    var row = InspSched.InspectorUI.CreateAndSet("", "small-12", "align-center", "warning-row");
                    row.appendChild(InspSched.InspectorUI.CreateTargetedLink(p.ContractorId, "//public.claycountygov.com/permitSearch/#tab=Contractor&sortfield=issuedate&sortdirection=D&contractorid=" + p.ContractorId + "&status=all&page=1&v=0", "_blank", "noopener", "column", "large-2", "small-12", "contractor-link"));
                    var warningText = document.createElement("p");
                    warningText.textContent = p.ContractorWarning;
                    warningText.classList.add("column");
                    warningText.classList.add("large-10");
                    warningText.classList.add("small-12");
                    warningText.classList.add("contractor-warning");
                    warningText.classList.add("end");
                    row.appendChild(warningText);
                    warningArea.appendChild(row);
                    isNotice = true;
                }
            }
            if (isNotice) {
                Show("contractor_notice");
            }
        }
        UI.SetAndShowContractorWarning = SetAndShowContractorWarning;
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
                        e.style.display = "flex";
                    else
                        e.style.display = displayType;
                }
            }
            else {
                var e = document.getElementById(id);
                if (displayType == null)
                    element.style.display = "flex";
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
            IssueList.classList.add('column');
            IssueList.classList.add('small-12');
            IssueList.classList.add('align-center');
            var thisIssue = document.createElement('li');
            thisHeading.appendChild(document.createTextNode("The following issue is preventing the ability to schedule an inspection:"));
            thisIssue.appendChild(document.createTextNode(error));
            thisIssue.style.marginLeft = "2rem;";
            IssueList.appendChild(thisIssue);
            reasons.appendChild(IssueList);
            var permitCheck = error.substr(8, 8);
            if (InspSched.ThisPermit.access != InspSched.access_type.public_access &&
                permitCheck == permitno &&
                (error.substr(30, 5) == 'holds' || error.substr(30, 5) == 'charg')) {
                IssueList.classList.remove('small-12');
                IssueList.classList.add('small-9');
                reasons.appendChild(CreateButtonToIMS(permitno, error));
            }
            document.getElementById("NotScheduled").style.display = "flex";
        }
        UI.InformUserOfError = InformUserOfError;
        function CreateButtonToIMS(permitNumber, error) {
            var label = "";
            var imsLink = "";
            var isHold = true;
            var buttonDiv = document.createElement('div');
            buttonDiv.classList.add('column');
            buttonDiv.classList.add('small-2');
            buttonDiv.classList.add('flex-container');
            buttonDiv.classList.add('align-center');
            switch (error.substr(30, 6)) {
                case "holds,":
                    label = "IMS Holds";
                    isHold = true;
                    break;
                case "charge":
                    label = "IMS Charges";
                    isHold = false;
                    break;
                default:
                    return buttonDiv;
            }
            var linkButton = document.createElement('button');
            linkButton.classList.add('small-8');
            linkButton.classList.add('align-self-center');
            linkButton.classList.add('button');
            linkButton.classList.add('DetailsButton');
            linkButton.value = isHold ? 'hold' : 'charge';
            linkButton.setAttribute('onclick', 'InspSched.SendToIMS(' + permitNumber + ', this.value)');
            linkButton.appendChild(document.createTextNode(label));
            buttonDiv.appendChild(linkButton);
            return buttonDiv;
        }
        function IsGoodCancelDate(inspection, access) {
            var today = new Date(new Date().toLocaleDateString());
            var inspDate = new Date(inspection.SchedDateTime.toString());
            if (inspDate <= today && (access == InspSched.access_type.public_access))
                return false;
            return true;
        }
        function ToggleInspDetails(InspectionId) {
            var current = InspSched.CurrentInspections.filter(function (j) { return j.InspReqID === parseInt(InspectionId); });
            if (current.length === 0) {
                console.log('an error occurred, the inspection you are looking for was not found in the current inspections.');
                return;
            }
            if (InspSched.UI.CurrentDetailsOpen != "" &&
                InspectionId != InspSched.UI.CurrentDetailsOpen) {
                var CurrentAddRemark = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_add_remark');
                var CurrentCompletedRemark = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_completed_remark');
                var CurrentComments = document.getElementById(InspSched.UI.CurrentDetailsOpen + '_comments');
                CurrentAddRemark.style.display = "none";
                CurrentComments.style.display = "none";
                if (CurrentCompletedRemark != null) {
                    CurrentCompletedRemark.style.display = "flex";
                }
                document.getElementById(InspSched.UI.CurrentDetailsOpen + '_details_btn').textContent = "Details";
            }
            var addRemark = document.getElementById(InspectionId + '_add_remark');
            var completedRemark = document.getElementById(InspectionId + '_completed_remark');
            var comments = document.getElementById(InspectionId + '_comments');
            var button = document.getElementById(InspectionId + '_details_btn');
            var inspectionDate = new Date(current[0].InspDateTime.toString());
            var d = new Date();
            var priorDate = new Date();
            priorDate.setDate(priorDate.getDate() - 2);
            var elementState = comments.style.display.toString().toLowerCase();
            if ((inspectionDate > priorDate &&
                addRemark != null) || current[0].ResultADC === "") {
                completedRemark.style.display = elementState == 'flex' ? 'flex' : 'none';
                addRemark.style.display = elementState == 'none' ? 'flex' : 'none';
            }
            if (comments != null) {
                comments.style.display = elementState == 'none' ? 'flex' : 'none';
            }
            var buttonString = (elementState == 'none' ? 'Hide ' : '') + 'Details';
            document.getElementById(InspectionId + '_details_btn').textContent = buttonString;
            InspSched.UI.CurrentDetailsOpen = InspectionId;
        }
        UI.ToggleInspDetails = ToggleInspDetails;
        function SetRemarkText(InspectionId, Remark) {
            var ul = document.getElementById("drop" + InspectionId.toString());
            var input = document.getElementById(InspectionId.toString() + "_remark_textarea");
            var button = document.getElementById(InspectionId.toString() + "_save_remark_button");
            input.value += Remark + "\n";
            button.disabled = false;
            ul.style.display = "none";
            return true;
        }
        UI.SetRemarkText = SetRemarkText;
    })(UI = InspSched.UI || (InspSched.UI = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=ui.js.map