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
    function HandleHash() {
        console.log('hash', location.hash);
        var hash = location.hash;
        var currentHash = new InspSched.LocationHash(location.hash.substring(1));
        if (currentHash.Permit.length > 0) {
            // if they entered a permit number, let's try and search for it
            // do permitsearch here
            PermitSearchField.value = currentHash.Permit;
            SearchPermit();
        }
    }
    InspSched.HandleHash = HandleHash;
    PermitSearchField.onkeydown = function (event) {
        if (event.keyCode == 13) {
            SearchPermit();
        }
    };
    function SearchPermit() {
        permitscreen.style.display = "none";
        InspSched.UI.Hide('SaveConfirmed');
        InspSched.UI.Hide('NotScheduled');
        $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);
        InspSched.transport.GetPermit(InspSched.UI.Search(PermitSearchField.value)).then(function (permits) {
            InspSched.CurrentPermits = permits;
            InspSched.UI.ProcessResults(permits, PermitSearchField.value);
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == permitNumSelect.value) {
                    InspSched.ThisPermit = permit;
                    if (permit.ErrorText == null) {
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
        IssueContainer.style.display = 'none';
        confirmed.style.display = "none";
        var permits = InspSched.CurrentPermits;
        // TODO: Add code to check if there is a selected date;
        SaveInspectionButton.setAttribute("disabled", "disabled");
        for (var _i = 0, permits_2 = permits; _i < permits_2.length; _i++) {
            var permit = permits_2[_i];
            if (permit.PermitNo == permitNumSelect.value) {
                InspSched.ThisPermit = permit;
                if (permit.ErrorText != null) {
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
            if (issues.length > 0) {
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
                //  Display safe confirm div
                var inspType = document.getElementById("InspSaveDesc");
                var inspPermitNo = document.getElementById("InspSavePermitNo");
                var inspSchedDate = document.getElementById("InspSaveDate");
                InspSched.UI.clearElement(inspType);
                InspSched.UI.clearElement(inspPermitNo);
                InspSched.UI.clearElement(inspSchedDate);
                inspType.appendChild(document.createTextNode(inspDesc));
                inspPermitNo.appendChild(document.createTextNode(InspSched.newInsp.PermitNo));
                inspSchedDate.appendChild(document.createTextNode(InspSched.newInsp.SchecDateTime.toLocaleDateString()));
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
        $(dpCalendar).datepicker('destroy');
        if (errorText == null) {
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
        }
        document.getElementById('InspectionScheduler').style.display = "flex";
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