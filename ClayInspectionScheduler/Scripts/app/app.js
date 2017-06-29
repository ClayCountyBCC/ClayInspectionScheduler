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
    var InspectionTypeSelect = document.getElementById("InspTypeSelect");
    var PermitSearchButton = document.getElementById("PermitSearchButton");
    var CloseIssueDivButton = document.getElementById("CloseIssueList");
    var PermitSearchField = document.getElementById("PermitSearch");
    var permitNumSelect = document.getElementById("PermitSelect");
    var inspScheduler = document.getElementById("InspectionScheduler");
    var IssueContainer = document.getElementById("NotScheduled");
    var IssuesDiv = document.getElementById('NotScheduled');
    var SaveInspectionButton = document.getElementById("SaveSchedule");
    function start() {
        LoadData();
    } //  END start()
    InspSched.start = start;
    PermitSearchField.onkeydown = function (event) {
        if (event.keyCode == 13) {
            $(PermitSearchButton).click();
        }
    };
    PermitSearchButton.onclick = function () {
        InspSched.transport.GetPermit(InspSched.UI.Search(PermitSearchField.value)).then(function (permits) {
            InspSched.CurrentPermits = permits;
            InspSched.UI.ProcessResults(permits, PermitSearchField.value);
            for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
                var permit = permits_1[_i];
                if (permit.PermitNo == permitNumSelect.value) {
                    InspSched.ThisPermit = permit;
                    BuildCalendar(permit.ScheduleDates);
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
    };
    permitNumSelect.onchange = function () {
        var permits = InspSched.CurrentPermits;
        // TODO: Add code to check if there is a selected date;
        SaveInspectionButton.setAttribute("disabled", "disabled");
        for (var _i = 0, permits_2 = permits; _i < permits_2.length; _i++) {
            var permit = permits_2[_i];
            if (permit.PermitNo == permitNumSelect.value) {
                InspSched.ThisPermit = permit;
                BuildCalendar(permit.ScheduleDates);
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
        var thisPermit = permitNumSelect.value;
        var thisInspCd = SaveInspectionButton.getAttribute("value");
        var IssueContainer = document.getElementById("NotScheduled");
        var IssuesDiv = document.getElementById('Reasons');
        IssueContainer.style.display = "none";
        InspSched.UI.clearElement(IssuesDiv);
        InspSched.newInsp = new InspSched.NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate());
        $(dpCalendar).data('datepicker').clearDates();
        var e = InspSched.transport.SaveInspection(InspSched.newInsp).then(function (issues) {
            var thisHeading = document.createElement('h5');
            var IssueList = document.createElement('ul');
            if (issues != null) {
                thisHeading.innerText = "The following issue(s) prevented scheduling the requested inspection:";
                thisHeading.className = "large-12 medium-12 small-12 row";
                IssuesDiv.appendChild(thisHeading);
                if (issues.length > 0) {
                    for (var i in issues) {
                        var thisIssue = document.createElement('li');
                        thisIssue.textContent = issues[i];
                        thisIssue.style.marginLeft = "2rem;";
                        IssueList.appendChild(thisIssue);
                    }
                    IssuesDiv.appendChild(IssueList);
                    IssueContainer.style.removeProperty("display");
                }
            }
            else {
                var thisIssue = document.createElement('li');
                thisIssue.textContent = "There is an issue saving the requested inspection. Please contact the Building Department " +
                    "for assistance at 904-284-6307.";
                thisIssue.style.marginLeft = "2rem;";
                IssueList.appendChild(thisIssue);
            }
            return true;
        }, function () {
            console.log('error in Saving Inspection');
            return false;
        });
    };
    CloseIssueDivButton.onclick = function () {
        IssueContainer.style.display = "none";
    };
    function LoadData() {
        SaveInspectionButton.setAttribute("disabled", "disabled");
        IssueContainer.style.display = "none";
        SaveInspectionButton.setAttribute("disabled", "disabled");
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
    function BuildCalendar(dates) {
        $(dpCalendar).datepicker('destroy');
        $(document).foundation();
        //
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
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map