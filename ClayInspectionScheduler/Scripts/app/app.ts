/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />

namespace InspSched
{
  "use strict";

  let dpCalendar = null;
  export let InspectionDates: Array<string> = [];
  export let InspectionTypes: Array<InspType> = [];
  export let firstDay: string;
  export let lastDay: string;
  export let newInsp: NewInspection;
  export let GracePeriodDate: string = "";
  export let CurrentPermits: Array<Permit> = [];
  export let CurrentInspections: Array<Inspection> = [];
  export let IssuesExist: Array<string> = [];
  export let ThisPermit: Permit;
  let permitscreen = <HTMLDivElement>document.getElementById('PermitScreen');
  let InspectionTypeSelect = <HTMLSelectElement>document.getElementById( "InspTypeSelect" );
  let PermitSearchButton = <HTMLButtonElement>document.getElementById( "PermitSearchButton" );
  let CloseIssueDivButton = <HTMLButtonElement>document.getElementById( "CloseIssueList" );
  let PermitSearchField = <HTMLInputElement>document.getElementById( "PermitSearch" );
  let permitNumSelect = <HTMLSelectElement>document.getElementById( "PermitSelect" );
  let inspScheduler = document.getElementById( "InspectionScheduler" );
  let IssueContainer: HTMLDivElement = ( <HTMLDivElement>document.getElementById( "NotScheduled" ) );
  let IssuesDiv: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'Reasons' ) );
  let SaveInspectionButton = document.getElementById("SaveSchedule");
  let confirmed = document.getElementById('SaveConfirmed');


  export function start(): void
  {
    LoadData();
    window.onhashchange = HandleHash;
    if (location.hash.substring(1).length > 0) HandleHash(); // if they pass something in the URL
  } //  END start()

  export function HandleHash()
  {
    console.log('hash', location.hash);
    let hash = location.hash;
    let currentHash = new LocationHash(location.hash.substring(1));
    if (currentHash.Permit.length > 0)
    {
      // if they entered a permit number, let's try and search for it
      // do permitsearch here
      PermitSearchField.value = currentHash.Permit;
      SearchPermit();
    }
  }

  PermitSearchField.onkeydown = function (event) {
    if (event.keyCode == 13) {
      SearchPermit();
    }
  };

  export function SearchPermit()
  {

    permitscreen.style.display = "none";
    UI.Hide('SaveConfirmed');

    UI.Hide('NotScheduled');

    $('#InspectionSchedulerTabs').foundation('selectTab', 'InspectionView', true);


    transport.GetPermit(InspSched.UI.Search(PermitSearchField.value)).then(function (permits: Array<Permit>)
    {
      console.log(permits);

      InspSched.CurrentPermits = permits;

      InspSched.UI.ProcessResults(permits, PermitSearchField.value);

      for (let permit of permits)
      {
        if (permit.PermitNo == permitNumSelect.value)
        {
          InspSched.ThisPermit = permit;
          if (permit.ErrorText == null)
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
    // TODO: Add code to check if there is a selected date;
    SaveInspectionButton.setAttribute("disabled", "disabled");

    for ( let permit of permits )
    {
      if (permit.PermitNo == permitNumSelect.value)
      {

        InspSched.ThisPermit = permit;
        if (permit.ErrorText !== null)
        {
          InspSched.UI.InformUserOfError(permit.PermitNo, permit.ErrorText);

        }
        else
        {

          if (ThisPermit.ErrorText === null)
            InspSched.UI.LoadInspTypeSelect(permit.PermitNo);
          BuildCalendar(permit.ScheduleDates);

        }
        break;
      }
    }
  }

  InspectionTypeSelect.onchange = function ()
  {

    SaveInspectionButton.setAttribute( "value", InspectionTypeSelect.value );
    if ( $( dpCalendar ).data( 'datepicker' ).getDate() != null )
    {
      SaveInspectionButton.removeAttribute( "disabled" );
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
    newInsp = new NewInspection( thisPermit, thisInspCd, $( dpCalendar ).data( 'datepicker' ).getDate() );

    var e = transport.SaveInspection(newInsp).then(function (issues: Array<string>)
    {
      
      let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
      let IssueList: HTMLUListElement = ( <HTMLUListElement>document.createElement( 'ul' ) );

      if ( issues[0] !== "success") 
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
        IssueContainer.style.display="flex";

      }
      else
      {
        let savesuccess: HTMLParagraphElement = (<HTMLParagraphElement>document.getElementById("SaveSuccess"));
        InspSched.UI.clearElement(savesuccess);
        savesuccess.appendChild(document.createTextNode(getInspectionDescription(issues[1]) + " " + issues[2]));
        document.getElementById("SaveConfirmed").style.display = "flex";
      }

      return true;

    }, function ()
      {
        console.log( 'error in Saving Inspection' );
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
    SaveInspectionButton.setAttribute( "disabled", "disabled" );
    IssueContainer.style.display = "none";
    LoadInspectionTypes();

  }

  function LoadInspectionTypes()
  {

    transport.GetInspType().then( function ( insptypes: Array<InspType> )
    {

      InspSched.InspectionTypes = insptypes;


    },
      function ()
      {
        console.log( 'error in LoadInspectionTypes' );
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspSched.InspectionTypes = [];
      } );
  }

  function getInspectionDescription(InspCode: string): string
  {
  
    for (let it of InspSched.InspectionTypes)
    {
      if (it.InspCd == InspCode)
        return it.InsDesc;
    }
    return "Unknown";
  }

  export function BuildCalendar(dates: Array<string>, errorText?: string)
  {
    $(dpCalendar).datepicker('destroy');

    if (errorText == null)
    {
      
      let additionalDisabledDates: string[] = GetAdditionalDisabledDates(dates);

      InspSched.InspectionDates = dates;
      InspSched.firstDay = InspSched.InspectionDates[0];
      InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];

      dpCalendar = $('#sandbox-container div').datepicker(
        <DatepickerOptions>
        {
          startDate: InspSched.firstDay,
          datesDisabled: additionalDisabledDates,
          endDate: InspSched.lastDay,
          maxViewMode: 0,
          toggleActive: true,

        })
      {
        $(dpCalendar).on('changeDate', function ()
        {

          let date = $(dpCalendar).data('datepicker').getDate();
          //return false;
          $('change-date').submit();

          EnableSaveButton();
        });

      };

      document.getElementById('InspectionScheduler').style.display = "flex";
    }



  }

  function EnableSaveButton()
  {
    {
      if ( InspectionTypeSelect.value != "" && $( dpCalendar ).data( 'datepicker' ).getDate() != null )
      {
        SaveInspectionButton.removeAttribute( "disabled" );
      }
      else
      {
        SaveInspectionButton.setAttribute( "disabled", "disabled" );
      }
    }
  }



  function GetAdditionalDisabledDates( dates: Array<string> ): Array<string>
  {
    var AdditionalDisabledDates: Array<string> = [];
    if ( dates.length > 2 )
    {
      for ( let d: number = 1; d < dates.length - 1; d++ )
      {
        AdditionalDisabledDates.push( dates[d] );

      }

    }

    return AdditionalDisabledDates;
  }

  export function UpdatePermitSelectList(PermitNo: string):void
  {
    document.getElementById("NotScheduled").style.display = "none";

    document.getElementById("SaveConfirmed").style.display = "none";

    let selectedoption: HTMLOptionElement = (<HTMLOptionElement>document.getElementById("select_" + PermitNo));

    selectedoption.selected = true;

    for (let permit of InspSched.CurrentPermits) {
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

  export function CancelInspection(InspID?: string, PermitNo?: string)
  {

    document.getElementById('NotScheduled').style.display = "none";

    if (InspID != null && PermitNo != null)
    {
      //Hide( 'FutureInspRow' );
      // TODO: Add function to not allow cancel if scheduled date of insp is current date 

      var isDeleted = transport.CancelInspection(InspID, PermitNo);

      // TODO: ADD code to inform user if the inspection has been deleted 

      // Reload inspection list after delete
      if (isDeleted)
      {
        InspSched.UI.GetInspList(PermitNo);
        BuildCalendar(ThisPermit.ScheduleDates);
      }

      else
      {
        //display notification of failed delete

      }
    }
  }

}
