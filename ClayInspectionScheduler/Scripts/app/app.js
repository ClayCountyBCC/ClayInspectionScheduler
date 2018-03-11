/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
/// <reference path="inspectorui.ts" />
/// <reference path="inspector.ts" />
/// <reference path="quickremark.ts" />
var InspSched;
(function (InspSched) {
    "use strict";
    var dpCalendar = null;
    InspSched.InspectorViewType = "address";
    InspSched.InspectionTypes = [];
    InspSched.InspectionQuickRemarks = [];
    InspSched.CurrentPermits = [];
    InspSched.CurrentInspections = [];
    InspSched.IssuesExist = [];
    InspSched.IVInspections = [];
    InspSched.Inspectors = [];
    InspSched.InspectorViewByPermit = []; // this is going to be the processed array of Inspection data.
    InspSched.InspectorViewByAddress = [];
    InspSched.HideTheseComments = []; // comments that contain these phrases will be hidden
    var InspectionTable = document.getElementById('InspectionTable');
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
        if (location.hash.length > 0) {
            if (location.hash && location.hash.substring(1).length > 0) {
                HandleHash(); // if they pass something in the URL
            }
        }
    } //  END start()
    InspSched.start = start;
    function updateHash(permit) {
        var hash = new InspSched.LocationHash(location.hash.substring(1));
        location.hash = hash.UpdatePermit(permit);
        var newhash = new InspSched.LocationHash(location.hash.substring(1));
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
        InspSched.UI.CurrentDetailsOpen = "";
        InspectionTable.style.display = "none";
        InspSched.UI.Hide('SaveConfirmed');
        InspSched.UI.Hide('NotScheduled');
        $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);
        var permitno = PermitSearchField.value.trim();
        InspSched.transport.GetPermit(InspSched.UI.Search(permitno)).then(function (permits) {
            InspSched.CurrentPermits = permits;
            InspSched.UI.ProcessResults(permits, permitno);
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == permitno) {
                    InspSched.ThisPermit = permit;
                    if (permit.ErrorText.length === 0) {
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
                // THIS LINE FOR TESTING ONLY
                permit.access = InspSched.access_type.inspector_access;
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
        var comment = document.getElementById("scheduler_comment");
        InspSched.newInsp = new InspSched.NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate(), comment.value);
        comment.value = "";
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
                var savesuccess = document.getElementById("SaveConfirmed");
                if (savesuccess) {
                    InspSched.UI.clearElement(savesuccess);
                }
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
        InspSched.InspectorUI.LoadDailyInspections();
        LoadInspectionQuickRemarks();
    }
    function LoadInspectionTypes() {
        InspSched.transport.GetInspType().then(function (insptypes) {
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
    function LoadInspectionQuickRemarks() {
        InspSched.transport.GetInspectionQuickRemarks().then(function (quickremarks) {
            InspSched.InspectionQuickRemarks = quickremarks;
            console.log('quick remarks', quickremarks);
        }, function () {
            console.log('error in Load Inspection Quick Remarks');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            InspSched.InspectionQuickRemarks = [];
        });
    }
    function BuildCalendar(dates, errorText) {
        if (errorText === void 0) { errorText = ""; }
        $(dpCalendar).datepicker('destroy');
        if (errorText.length === 0) {
            dpCalendar = $('#sandbox-container div').datepicker({
                startDate: InspSched.ThisPermit.Dates.minDate_string,
                datesDisabled: InspSched.ThisPermit.Dates.badDates_string,
                endDate: InspSched.ThisPermit.Dates.maxDate_string,
                maxViewMode: 0,
                toggleActive: true,
            });
            {
                $(dpCalendar).on('changeDate', function () {
                    var date = $(dpCalendar).data('datepicker').getDate();
                    //return false;
                    $('change-date').submit();
                    EnableSaveNewInspectionButton();
                });
            }
            ;
            document.getElementById('InspectionScheduler').style.display = "flex";
        }
    }
    InspSched.BuildCalendar = BuildCalendar;
    function EnableSaveNewInspectionButton() {
        {
            if (InspectionTypeSelect.value != "" && $(dpCalendar).data('datepicker').getDate() != null) {
                SaveInspectionButton.removeAttribute("disabled");
            }
            else {
                SaveInspectionButton.setAttribute("disabled", "disabled");
            }
        }
    }
    function disableSaveCommentButton(InspectionRequestId) {
        var commentButton = document.getElementById(InspectionRequestId + "_save_comment_button");
        var remarkButton = document.getElementById(InspectionRequestId + "_save_remark_button");
        var currentResult = remarkButton.value;
        var remarkTextarea = document.getElementById(InspectionRequestId + "_remark_textarea");
        var value = document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked').value;
        if (value == currentResult && remarkTextarea.value != "") {
            commentButton.removeAttribute("disabled");
        }
        else {
            commentButton.setAttribute("disabled", "disabled");
        }
        if (remarkButton !== null) {
            enableSaveResultButton(InspectionRequestId);
        }
    }
    InspSched.disableSaveCommentButton = disableSaveCommentButton;
    function enableSaveResultButton(InspectionRequestId) {
        var remarkButton = document.getElementById(InspectionRequestId + "_save_remark_button");
        var commentButton = document.getElementById(InspectionRequestId + "_save_comment_button");
        var remarkTextarea = document.getElementById(InspectionRequestId + "_remark_textarea");
        var value = document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked').value;
        var currentResult = remarkButton.value;
        switch (value) {
            case "A":
                if (currentResult != value) {
                    remarkButton.removeAttribute("disabled");
                    commentButton.setAttribute("disabled", "disabled");
                }
                return;
            case "P":
            case "D":
            case "N":
            case "C":
                if (remarkTextarea.value != "") {
                    remarkButton.removeAttribute("disabled");
                    commentButton.setAttribute("disabled", "disabled");
                }
                else {
                    remarkButton.setAttribute("disabled", "disabled");
                    if (value == remarkButton.value && remarkTextarea.value == "") {
                        commentButton.removeAttribute("disabled");
                        commentButton.setAttribute("disabled", "disabled");
                    }
                    else {
                        commentButton.setAttribute("disabled", "disabled");
                    }
                }
                return;
            default:
                if (remarkTextarea.value == "" && remarkButton.value == value) {
                    commentButton.removeAttribute("disabled");
                    remarkButton.setAttribute("disabled", "disabled");
                }
                else {
                    commentButton.setAttribute("disabled", "disabled");
                    remarkButton.removeAttribute("disabled");
                }
                return;
        }
    }
    InspSched.enableSaveResultButton = enableSaveResultButton;
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
    function SaveComment(InspectionRequestId) {
        var commentTextarea = document.getElementById(InspectionRequestId + "_comment_textarea");
        var completedComments = document.getElementById(InspectionRequestId + "_audit");
        var NewComment = commentTextarea.value;
        InspSched.transport.AddComment(parseInt(InspectionRequestId), NewComment).then(function (inspection) {
            completedComments.textContent = inspection.Comment;
            document.getElementById(InspectionRequestId.toString() + "_textbox_div").style.display = "flex";
            commentTextarea.value = "";
        }, function () {
            console.log("error in SaveComment");
        });
    }
    InspSched.SaveComment = SaveComment;
    function UpdateResultButton(InspectionId, status) {
        var remarkButton = document.getElementById(InspectionId + "_save_remark_button");
        switch (status) {
            case "saving":
                remarkButton.textContent = "Saving...";
                remarkButton.classList.remove;
                remarkButton.disabled = true;
                break;
            case "saved":
                remarkButton.textContent = "Saved";
                remarkButton.disabled = false;
                window.setTimeout(function (j) { remarkButton.textContent = "Save Result"; }, 5000);
                break;
        }
    }
    function UpdateInspection(permitNumber, InspectionRequestId) {
        UpdateResultButton(InspectionRequestId, "saving");
        var completedRemark = document.getElementById(InspectionRequestId + "_completed_remark_text");
        var completedComments = document.getElementById(InspectionRequestId + "_audit");
        var remarkTextarea = document.getElementById(InspectionRequestId + "_remark_textarea");
        var commentTextarea = document.getElementById(InspectionRequestId + "_comment_textarea");
        var value = document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked').value;
        var completedCommentsDIV = document.getElementById(InspectionRequestId + "_textbox_div");
        var inspDateTime = document.getElementById(InspectionRequestId + "_inspection-date-time");
        completedCommentsDIV.style.display = "flex";
        var remarkText = remarkTextarea.value;
        var commentText = commentTextarea.value;
        var inspReqIdAsNum = parseInt(InspectionRequestId);
        InspSched.transport.UpdateInspection(permitNumber, inspReqIdAsNum, value, remarkText, commentText).then(function (updatedInspection) {
            //Instead of SearchPermit(), The current open Inspection data should change while expanded, much like the save comment.
            //SearchPermit();
            remarkTextarea.value = updatedInspection.Remarks;
            completedComments.textContent = "";
            completedComments.textContent = updatedInspection.Comment;
            commentTextarea.value = "";
            InspSched.UI.clearElement(inspDateTime);
            inspDateTime.appendChild(document.createTextNode(updatedInspection.DisplayInspDateTime));
            completedRemark.innerText = updatedInspection.Remarks;
            UpdateResultButton(InspectionRequestId, "saved");
        }, function () {
            console.log('error in UpdateInspection');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            //SearchPermit();
        });
        // This will be updated to take inspection data returned from server and update the inspection to show new data.
    }
    InspSched.UpdateInspection = UpdateInspection;
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
    function FilterQuickRemarks(InspectionType, IsPrivateProvider) {
        return InspSched.InspectionQuickRemarks.filter(function (j) {
            var permitTypeCheck = false;
            switch (InspectionType) {
                case "0":
                case "1":
                case "9":
                    if (j.Building) {
                        return true;
                    }
                case "2":
                    if (j.Electrical) {
                        return true;
                    }
                case "3":
                    if (j.Plumbing) {
                        return true;
                    }
                case "4":
                    if (j.Mechanical) {
                        return true;
                    }
                case "6":
                    // fire
                    break;
            }
            return (IsPrivateProvider && j.PrivateProvider);
        });
    }
    InspSched.FilterQuickRemarks = FilterQuickRemarks;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map