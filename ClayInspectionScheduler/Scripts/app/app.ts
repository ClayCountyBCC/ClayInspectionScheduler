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
  var InspectionTypeSelect = <HTMLSelectElement>document.getElementById( "InspTypeSelect" );
  var PermitSearchButton = <HTMLButtonElement>document.getElementById( "PermitSearchButton" );
  var PermitSearchField = <HTMLInputElement>document.getElementById( "PermitSearch" );
  var permitNumSelect = <HTMLSelectElement>document.getElementById( "PermitSelect" );
  var inspScheduler = document.getElementById( "InspectionScheduler" );
  var SaveInspectionButton = document.getElementById( "SaveSchedule" );
  let IssuesDiv: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'NotScheduled' ) );
  

  export function start(): void
  {
    SaveInspectionButton.setAttribute( "disabled", "disabled" );

    LoadData();

    IssuesDiv.style.display = "none";

    SaveInspectionButton.setAttribute( "disabled", "disabled" );

    PermitSearchButton.onclick = function ()
    {

      InspSched.UI.Search( PermitSearchField.value );

      console.log( "PermitNo: " + PermitSearchField.value );
      if ( PermitSearchField.value != "" )
      {
        GetGracePeriodDate();
      }


    }

    permitNumSelect.onchange = function ()
    {
      
      // TODO: Add code to check if there is a selected date;
      SaveInspectionButton.setAttribute( "disabled", "disabled" );

      InspSched.UI.GetInspList( permitNumSelect.value );
      GetGracePeriodDate();


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

      let thisPermit: string = permitNumSelect.value;
      let thisInspCd: string = SaveInspectionButton.getAttribute( "value" );
      let IssuesDiv: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'NotScheduled' ) );
      IssuesDiv.style.display = "none";
      InspSched.UI.clearElement( IssuesDiv );


      newInsp = new NewInspection( thisPermit, thisInspCd, $( dpCalendar ).data( 'datepicker' ).getDate() );
      $( dpCalendar ).data( 'datepicker' ).clearDates();

      console.log( "In SaveInspection onchangedate: \"" + $( dpCalendar ).data( 'datepicker' ).getDate() + "\"" );

      transport.SaveInspection( newInsp ).then( function ( issues: Array<string> )
      {

        if ( issues.length > 0 )
        {
          let thisHeading: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( 'h5' ) );
          thisHeading.innerText = "The following issue(s) prevented scheduling the requested inspection:";
          thisHeading.className = "large-12 medium-12 small-12 row";
          IssuesDiv.appendChild( thisHeading );
          let IssueList: HTMLUListElement = ( <HTMLUListElement>document.createElement( 'ul' ) );
          for ( let i in issues )
          {
            let thisIssue: HTMLLIElement = ( <HTMLLIElement>document.createElement( 'li' ) );
            thisIssue.textContent = issues[i];
            thisIssue.style.marginLeft = "2rem;";
            console.log( issues[i] );
            IssueList.appendChild( thisIssue );

          }

          IssuesDiv.appendChild( IssueList );
          IssuesDiv.style.removeProperty( "display" );
        }
        // Will do something here when I am able to get this to my Controller
        return true;

      }, function ()
        {
          console.log( 'error Saving Inspection' );
          return false;
        });


    }

  } //  END start()
  
  function LoadData()
  {
    LoadInspectionTypes();
  }

  function LoadInspectionTypes()
  {
    
    transport.GetInspType().then(function (insptypes: Array<InspType>)
    {
      InspectionTypes = insptypes;
      console.log('InspectionTypes', InspectionTypes);
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspectionTypes = [];
      });
  }

  function GetGracePeriodDate()
  {
    let checkString: string = ( permitNumSelect.value == "" ? PermitSearchField.value : permitNumSelect.value );

    transport.GetGracePeriodDate( checkString ).then( function ( GracePeriodDate: string )
    {
      var mydatestring = Date.parse( GracePeriodDate );
      var todaystring = Date.now();
      
      if ( mydatestring != undefined && mydatestring < todaystring )
      {
        console.log( "I should pass the permit number to the InspSched.UI.permitSchedulingIssue(permitNumSelect.value)" );
        console.log( "And I shouldn't run LoadInspectionDates" );
      }
      else
      {
        LoadInspectionDates( GracePeriodDate[0] );
      }
    });

  }

  function LoadInspectionDates(GracePeriodDate?: string) 
  {
    
   

    transport.GenerateDates().then( function ( dates: Array<string> )
    {
      
      InspSched.InspectionDates = dates;
      InspSched.firstDay = InspSched.InspectionDates[0];
      InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];

      if ( GracePeriodDate != undefined && Date.parse( GracePeriodDate.toString() ) < Date.parse( InspSched.lastDay) )
      {
        InspSched.lastDay = GracePeriodDate;
        console.log( "GracePeriodDate: " + GracePeriodDate.toString() );
      }

      BuildCalendar( dates );

      console.log( 'InspectionDates', InspSched.InspectionDates );


    },
      function ()
      {
        console.log( 'error in LoadInspectionDates' );
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspectionDates = [];
      });

  }

  function GetAdditionalDisabledDates(dates: Array<string>): Array<string>
  {
    var AdditionalDisabledDates: Array<string> = [];
    if ( dates.length > 2 )
    {
      for ( let d: number = 1; d < dates.length - 1; d++ )
      {
        AdditionalDisabledDates.push(dates[d]);

      }

    }

    return AdditionalDisabledDates;
  }

  function BuildCalendar(dates: Array<string>)
  {
    $( dpCalendar ).datepicker( 'destroy' );

    $( document ).foundation();

    //
    let additionalDisabledDates: string []= GetAdditionalDisabledDates( dates );

      dpCalendar = $( '#sandbox-container div' ).datepicker(
        <DatepickerOptions>
        {
          startDate: InspSched.firstDay,
          datesDisabled: additionalDisabledDates,
          endDate: InspSched.lastDay,
          maxViewMode: 0,
          toggleActive: true,
          
      })
      {
        $( dpCalendar ).on( 'changeDate', function ()
        {
          
          let date = $( dpCalendar).data('datepicker').getDate();
          console.log( "In calendar onchangedate: " + date );
          //return false;
          $( 'change-date' ).submit();

          EnableSaveButton();
        });

      };
    

      console.log
  }

  function EnableSaveButton()
  {

    {
      if ( InspectionTypeSelect.value != "" &&  $( dpCalendar ).data( 'datepicker' ).getDate() != null  )
      {
        SaveInspectionButton.removeAttribute( "disabled" );
      }
      else
      {
        SaveInspectionButton.setAttribute( "disabled", "disabled" );

      }
    }
  }

}