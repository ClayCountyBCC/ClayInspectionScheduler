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


namespace InspSched
{
  "use strict";

  let dpCalendar = null;
  export let InspectorViewType: string = "address";
  export let InspectionTypes: Array<InspType> = [];
  export let InspectionQuickRemarks: Array<QuickRemark> = [];
  export let newInsp: NewInspection;
  export let CurrentPermits: Array<Permit> = [];
  export let CurrentInspections: Array<Inspection> = [];
  export let IssuesExist: Array<string> = [];
  export let ThisPermit: Permit;
  export let IVInspections: Array<Inspection> = [];
  export let Inspectors: Array<Inspector> = [];
  export let UserIsContractInspector: boolean;
  export let InspectorViewByPermit: Array<InspectionViewByPermit> = [];  // this is going to be the processed array of Inspection data.
  export let InspectorViewByAddress: Array<InspectionViewByAddress> = [];
  export let InDevelopment: boolean = false;
  export let eeInPublic: boolean = false;
  export let HideTheseComments: Array<string> = []; // comments that contain these phrases will be hidden
 
  let InspectionTable = <HTMLDivElement>document.getElementById('InspectionTable');
  let InspectionTypeSelect = <HTMLSelectElement>document.getElementById("InspTypeSelect");
  let PermitSearchButton = <HTMLButtonElement>document.getElementById("PermitSearchButton");
  let CloseIssueDivButton = <HTMLButtonElement>document.getElementById("CloseIssueList");
  let PermitSearchField = <HTMLInputElement>document.getElementById("PermitSearch");
  let permitNumSelect = <HTMLSelectElement>document.getElementById("PermitSelect");
  let inspScheduler = document.getElementById("InspectionScheduler");
  let IssueContainer: HTMLDivElement = (<HTMLDivElement>document.getElementById("NotScheduled"));
  let IssuesDiv: HTMLDivElement = (<HTMLDivElement>document.getElementById('Reasons'));
  let SaveInspectionButton = document.getElementById("SaveSchedule");
  let confirmed = document.getElementById('SaveConfirmed');


  export function start(): void
  {

    LoadData();
    window.onhashchange = HandleHash;
    if (location.hash.length > 0)
    {

      if (location.hash && location.hash.substring(1).length > 0)
      {
        HandleHash(); // if they pass something in the URL
      }
    }

  } //  END start()

  export function updateHash(permit: string)
  {
    let hash = new LocationHash(location.hash.substring(1));
    location.hash = hash.UpdatePermit(permit);
    let newhash = new LocationHash(location.hash.substring(1));
    if (newhash.Permit === hash.Permit)
    {
      SearchPermit();
    }
  }

  export function HandleHash()
  {
    let hash = location.hash;
    let currentHash = new LocationHash(location.hash.substring(1));
    if (currentHash.Permit.length > 0)
    {
      // if they entered a permit number, let's try and search for it
      // do permitsearch here
      PermitSearchField.value = currentHash.Permit.trim();
      SearchPermit();
    }
  }

  PermitSearchField.onkeydown = function (event)
  {
    if (event.keyCode == 13)
    {
      //SearchPermit();
      updateHash(PermitSearchField.value);
    }
  };

  export function SendToIMS(permitNumber: string, type: string): void
  { 
    var isInternal = InspSched.Inspectors.length > 0;

    var linkStart = "";

    if (type == 'hold')
    {
      window.open(
        isInternal && !eeInPublic ?

          (InspSched.Inspectors[0].AppAddressStart +
            "Holds.aspx?PermitNo=" + permitNumber + "&OperId=&Nav=PL") :

          ("//public.claycountygov.com/permitsearch/#tab=permit&permitdisplay=" + permitNumber +
            "&sortfield=issuedate&sortdirection=D&permitnumber=" + permitNumber + "&status=all&page=1&v=0")
      );
    }
    else
    {
      if (InspSched.InDevelopment == true)
      {
        linkStart = "qa";
      }
      else
      {
        linkStart = isInternal && !eeInPublic ? "apps" : "public";
      }

      window.open("//" + linkStart +
        ".claycountygov.com/claypay/#Permit=" + permitNumber, "_blank");
    }

  }

  export function SearchPermit()
  {
    InspSched.UI.CurrentDetailsOpen = "";
    InspectionTable.style.display = "none";
    UI.Hide('SaveConfirmed');

    UI.Hide('NotScheduled');

    $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);

    let permitno: string = PermitSearchField.value.trim()
    transport.GetPermit(InspSched.UI.Search(permitno)).then(function (permits: Array<Permit>)
    {
      InspSched.CurrentPermits = permits;

      InspSched.UI.ProcessResults(permits, permitno);

      for (let permit of permits)
      {
        if (permit.PermitNo == permitno)
        {
          InspSched.ThisPermit = permit;
          if (permit.ErrorText.length === 0)
          {
            BuildCalendar(permit.ScheduleDates);
          }

          else
          {
            InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);
          }
          break;
        }
      }

      return true;

    },
      function ()
      {

        console.log('error getting permits');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        InspSched.UI.Hide('Searching');

        return false;
      });


  }

  permitNumSelect.onchange = function ()
  {
    $(dpCalendar).datepicker('destroy');

    IssueContainer.style.display = 'none';
    confirmed.style.display = "none";
    let permits = InspSched.CurrentPermits;

    SaveInspectionButton.setAttribute("disabled", "disabled");

    for (let permit of permits)
    {
      if (permit.PermitNo == permitNumSelect.value)
      {

        InspSched.ThisPermit = permit;

        if (permit.ErrorText.length > 0)
        {
          InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);

        }
        else
        {
          InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
          BuildCalendar(permit.ScheduleDates);

        }
        break;
      }
    }
  }

  InspectionTypeSelect.onchange = function ()
  {

    SaveInspectionButton.setAttribute("value", InspectionTypeSelect.value);
    if ($(dpCalendar).data('datepicker').getDate() != null)
    {
      SaveInspectionButton.removeAttribute("disabled");
    }
  }

  SaveInspectionButton.onclick = function ()
  {
    inspScheduler.style.display = "none";
    confirmed.style.display = "none";
    IssueContainer.style.display = "none";
    InspSched.UI.clearElement(IssuesDiv);

    let thisPermit: string = permitNumSelect.value;
    let thisInspCd: string = SaveInspectionButton.getAttribute("value");
    let thisInspDesc: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("InspTypeSelect"));
    let inspDesc: string = thisInspDesc.options[thisInspDesc.selectedIndex].textContent;
    let comment: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById("gate_code"));



    newInsp = new NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate(), comment.value.length > 0 ? "Gate Code: " + comment.value : "");
    comment.value = "";

    var e = transport.SaveInspection(newInsp).then(function (issues: Array<string>)
    {

      let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
      let IssueList: HTMLUListElement = (<HTMLUListElement>document.createElement('ul'));
      if (issues.length === 0) issues.push("A system error has occurred. Please check your request and try again.");
      if (issues[0].toLowerCase().indexOf("inspection has been scheduled") === -1) 
      {

        InspSched.UI.clearElement(thisHeading);
        thisHeading.appendChild(document.createTextNode("The following issue(s) prevented scheduling the requested inspection:"));

        for (let i in issues)
        {
          let thisIssue: HTMLLIElement = (<HTMLLIElement>document.createElement('li'));
          thisIssue.appendChild(document.createTextNode(issues[i]));
          thisIssue.style.marginLeft = "2rem;";
          IssueList.appendChild(thisIssue);

        }

        IssuesDiv.appendChild(IssueList);
        IssueContainer.style.display = "flex";

      }
      else
      {
        let savesuccess: HTMLParagraphElement = (<HTMLParagraphElement>document.getElementById("SaveConfirmed"));
        if (savesuccess)
        {
          InspSched.UI.clearElement(savesuccess);

        }
        savesuccess.appendChild(document.createTextNode(issues[0]));
        document.getElementById("SaveConfirmed").style.display = "flex";
      }

      return true;

    }, function ()
      {
        console.log('error in Saving Inspection');
        return false;
      });

    if (IssuesExist.length > 0)
      IssueContainer.style.display = 'flex';

    InspSched.UI.GetInspList(thisPermit);
  }

  CloseIssueDivButton.onclick = function ()
  {
    IssueContainer.style.display = "none";
  }

  function LoadData()
  {

    if (location.hostname.substr(0, 3).toLowerCase() === "web" || location.hostname.substr(0, 6).toLowerCase() === "public")
    {
      eeInPublic = true;
    }

    SaveInspectionButton.setAttribute("disabled", "disabled");
    IssueContainer.style.display = "none";
    LoadInspectionTypes();
    InspectorUI.LoadDailyInspections();
    window.setInterval(LoadInspectionsIfBetween6AMand6PM, 60 * 5 * 1000); // update every 5 minutes.
    LoadInspectionQuickRemarks();

  }

  function LoadInspectionsIfBetween6AMand6PM(): void
  {
    var d = new Date();

    if (d.getHours() > 6 && d.getHours() < 18)
    {
      InspectorUI.LoadDailyInspections();
    }

  }

  function LoadInspectionTypes()
  {
    transport.GetInspType().then(function (insptypes: Array<InspType>)
    {
      InspSched.InspectionTypes = insptypes;
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspSched.InspectionTypes = [];
      });
  }

  function LoadInspectionQuickRemarks(): void
  {
    transport.GetInspectionQuickRemarks().then(function (quickremarks: Array<QuickRemark>)
    {
      InspSched.InspectionQuickRemarks = quickremarks;
      console.log('quick remarks', quickremarks);
    },
      function ()
      {
        console.log('error in Load Inspection Quick Remarks');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        InspSched.InspectionQuickRemarks = [];
      });
  }

  export function BuildCalendar(dates: Array<string>, errorText: string = "")
  {
    $(dpCalendar).datepicker('destroy');

    if (errorText.length === 0)
    {

      dpCalendar = $('#sandbox-container div').datepicker(
        <DatepickerOptions>
        {
          startDate: InspSched.ThisPermit.Dates.minDate_string,
          datesDisabled: InspSched.ThisPermit.Dates.badDates_string,
          endDate: InspSched.ThisPermit.Dates.maxDate_string,
          maxViewMode: 0,
          toggleActive: true,

        })
      {
        $(dpCalendar).on('changeDate', function ()
        {

          let date = $(dpCalendar).data('datepicker').getDate();
          //return false;
          $('change-date').submit();

          EnableSaveNewInspectionButton();
        });

      };

      document.getElementById('InspectionScheduler').style.display = "flex";
    }



  }

  function EnableSaveNewInspectionButton()
  {
    {
      if (InspectionTypeSelect.value != "" && $(dpCalendar).data('datepicker').getDate() != null)
      {
        SaveInspectionButton.removeAttribute("disabled");
      }
      else
      {
        SaveInspectionButton.setAttribute("disabled", "disabled");
      }
    }
  }

  export function disableSaveCommentButton(InspectionRequestId: string)
  {
    let commentButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_comment_button"));
    let remarkButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_remark_button"));

    let currentResult = remarkButton.value;

    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));

    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;

    if (value == currentResult && remarkTextarea.value != "")
    {
      commentButton.removeAttribute("disabled");
    }
    else
    {
      commentButton.setAttribute("disabled", "disabled");
    }
    if (remarkButton !== null)
    {
      enableSaveResultButton(InspectionRequestId);
    }

  }

  export function enableSaveResultButton(InspectionRequestId: string)
  {
    let remarkButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_remark_button"));
    let commentButton: HTMLButtonElement = (<HTMLButtonElement>document.getElementById(InspectionRequestId + "_save_comment_button"));

    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));

    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;
    let currentResult = remarkButton.value;


    switch (value)
    {
      case "A":
        if (currentResult != value)
        {
          remarkButton.removeAttribute("disabled");
          commentButton.setAttribute("disabled", "disabled");

        }
        return;
      case "P":
      case "D":
      case "N":
      case "C":
        if (remarkTextarea.value != "")
        {
          remarkButton.removeAttribute("disabled");
          commentButton.setAttribute("disabled", "disabled");

        }
        else
        {
          remarkButton.setAttribute("disabled", "disabled");
          if (value == remarkButton.value && remarkTextarea.value == "")
          {
            commentButton.removeAttribute("disabled");
            commentButton.setAttribute("disabled", "disabled");

          }
          else
          {
            commentButton.setAttribute("disabled", "disabled");
          }
        }
        return;
      default:
        if (remarkTextarea.value == "" && remarkButton.value == value)
        {
          commentButton.removeAttribute("disabled");
          remarkButton.setAttribute("disabled", "disabled");
        }
        else
        {
          commentButton.setAttribute("disabled", "disabled");
          remarkButton.removeAttribute("disabled");

        }
        return;
    }

  }

  export function UpdatePermitSelectList(PermitNo: string): void
  {
    document.getElementById("NotScheduled").style.display = "none";

    document.getElementById("SaveConfirmed").style.display = "none";

    let selectedoption: HTMLOptionElement = (<HTMLOptionElement>document.getElementById("select_" + PermitNo));

    selectedoption.selected = true;

    for (let permit of InspSched.CurrentPermits)
    {
      if (permit.PermitNo == permitNumSelect.value)
      {
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

  export function SaveComment(InspectionRequestId: string)
  {
    let commentTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_comment_textarea"));
    let completedComments: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_audit"));
    let NewComment = commentTextarea.value;

    transport.AddComment(parseInt(InspectionRequestId), NewComment).then(function (inspection: Inspection)
    {
      completedComments.textContent = inspection.Comment;
      document.getElementById(InspectionRequestId.toString() + "_textbox_div").style.display = "flex";
      commentTextarea.value = "";

    }, function ()
      {
        console.log("error in SaveComment");
      });
  }

  function UpdateResultButton(InspectionId: string, status: string): void
  {
    let remarkButton = <HTMLButtonElement>document.getElementById(InspectionId + "_save_remark_button");
    switch (status)
    {
      case "saving":
        remarkButton.textContent = "Saving...";
        remarkButton.classList.remove;
        remarkButton.disabled = true;
        break;
      case "saved":
        remarkButton.textContent = "Saved";
        remarkButton.disabled = false;
        window.setTimeout(function (j) { remarkButton.textContent = "Save Result" }, 5000);
        break;
      case "error":
        remarkButton.textContent = "Error";
        remarkButton.disabled = false;
        window.setTimeout(function (j) { remarkButton.textContent = "Save Result" }, 5000);
        break;

    }
  }

  export function UpdateInspection(permitNumber: string, InspectionRequestId: string)
  {
    UpdateResultButton(InspectionRequestId, "saving");

    let completedRemark = (<HTMLDivElement>document.getElementById(InspectionRequestId + "_completed_remark_text"));
    let completedComments = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_audit"));
    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_remark_textarea"));
    let commentTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(InspectionRequestId + "_comment_textarea"));
    let value: string = (<HTMLInputElement>document.querySelector('input[name="' + InspectionRequestId + '_results"]:checked')).value;
    let completedCommentsDIV = (<HTMLDivElement>document.getElementById(InspectionRequestId + "_textbox_div"));
    let inspDateTime: HTMLDivElement = (<HTMLDivElement>document.getElementById(InspectionRequestId + "_inspection-date-time"));
    let updatedResultADC: HTMLDivElement = (<HTMLDivElement>document.getElementById(InspectionRequestId + "_inspection_resultADC"));

    completedCommentsDIV.style.display = "flex";
    let remarkText = remarkTextarea.value;

    let commentText = commentTextarea.value;

    let inspReqIdAsNum = parseInt(InspectionRequestId);

    transport.UpdateInspection(permitNumber, inspReqIdAsNum, value, remarkText, commentText).then(function (updatedInspection: Inspection)
    {
      //Instead of SearchPermit(), The current open Inspection data should change while expanded, much like the save comment.
      //SearchPermit();
      if (updatedInspection.Errors.length == 0)
      {
        remarkTextarea.value = updatedInspection.Remarks;
        completedComments.textContent = "";
        completedComments.textContent = updatedInspection.Comment;
        UI.clearElement(updatedResultADC);
        updatedResultADC.appendChild(document.createTextNode(updatedInspection.ResultDescription));
        commentTextarea.value = "";
        UI.clearElement(inspDateTime);
        inspDateTime.appendChild(document.createTextNode(updatedInspection.DisplayInspDateTime));

        completedRemark.innerText = updatedInspection.Remarks;
        UpdateResultButton(InspectionRequestId, "saved");
      }
      else
      {
        let errorSpot = <HTMLParagraphElement>document.getElementById("ResultErrorMessage");
        InspSched.UI.clearElement(errorSpot);

        errorSpot.appendChild(document.createTextNode("Permit number " + updatedInspection.PermitNo))
        errorSpot.appendChild(document.createElement("br"))
        errorSpot.appendChild(document.createTextNode("Attempt to update result on " + updatedInspection.InsDesc + " inspection\r"))
        errorSpot.appendChild(document.createElement("br"))
        errorSpot.appendChild(document.createTextNode(updatedInspection.UpdateError));

        $('#updateResultErrorModal').foundation('open');
        UpdateResultButton(InspectionRequestId, "error");

      }

      
    }, function ()
      {
        console.log('error in UpdateInspection');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //SearchPermit();
      });



    // This will be updated to take inspection data returned from server and update the inspection to show new data.


  }

  export function CancelInspection(InspID?: number, PermitNo?: string)
  {

    document.getElementById('NotScheduled').style.display = "none";

    if (InspID != null && PermitNo != null)
    {

      var isDeleted = transport.CancelInspection(InspID, PermitNo);

      // Reload inspection list after delete
      if (isDeleted)
      {
        InspSched.UI.GetInspList(PermitNo);
        BuildCalendar(InspSched.ThisPermit.ScheduleDates);
      }

      else
      {
        //display notification of failed delete

      }
    }
  }

  export function FilterQuickRemarks(InspectionType: string, IsPrivateProvider: boolean): Array<QuickRemark>
  {
    return InspSched.InspectionQuickRemarks.filter(
      function (j)
      {
        let permitTypeCheck: boolean = false;
        switch (InspectionType)
        {
          case "0":
          case "1":
          case "9":
            if (j.Building)
            {
              return true;
            }

          case "2":
            if (j.Electrical)
            {
              return true;
            }
          case "3":
            if (j.Plumbing)
            {
              return true;
            }
          case "4":
            if (j.Mechanical)
            {
              return true;
            }
          case "6":
            // fire
            break;
        }
        return (IsPrivateProvider && j.PrivateProvider)
      });
  }

  export function CanResultBeChanged(CompletedInspectionDateTime: Date): boolean
  {


    // Sections added below are dependent on access_type and date
    // cannot be public and cannot be earlier than today (will be changed to earlier date)
    var twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    var baseDate = new Date("0001-01-02");
    baseDate = new Date(baseDate.setHours(0, 0, 0, 0));

    var thisInspDate: Date = new Date(CompletedInspectionDateTime.toString());
    thisInspDate = new Date(thisInspDate.setHours(0, 0, 0, 0));

    var CanBeChanged = thisInspDate.getTime() == baseDate.getTime();
    console.log("inspection has not beencompleted: ", CanBeChanged);

    if (!CanBeChanged)
    {
      CanBeChanged = thisInspDate.getTime() > twoDaysAgo.getTime();
      console.log("inspection has been completed but can be changed: ", CanBeChanged);
    }

    return CanBeChanged;
  }
}
