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
  var InspectionTypeSelect = <HTMLSelectElement>document.getElementById( "InspTypeSelect" );
  var PermitSearchButton = <HTMLButtonElement>document.getElementById( "PermitSearchButton" );
  var PermitSearchField = <HTMLInputElement>document.getElementById( "PermitSearch" );
  var permitNumSelect = <HTMLSelectElement>document.getElementById( "PermitSelect" );
  var inspScheduler = document.getElementById( "InspectionScheduler" );
  var SaveInspectionButton = document.getElementById( "SaveSchedule" );
  let IssuesDiv: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'NotScheduled' ) );
  

  export function start(): void
  {
    LoadData();

    PermitSearchButton.onclick = function ()
    {
      ;

      transport.GetPermit( InspSched.UI.Search( PermitSearchField.value )).then( function ( permits: Array<Permit> )
      {

        InspSched.CurrentPermits = permits;
        InspSched.UI.ProcessResults( permits, PermitSearchField.value );

        for ( let permit of permits )
        {
          console.log( "In for loop searching for Permit #" + permit.PermitNo );
          if ( permit.PermitNo == permitNumSelect.value )
          {
            console.log( "Build Calendar for Permit #" + permitNumSelect.value );
            BuildCalendar( permit.ScheduleDates );
            break;
          }
        }

        return true;

      },
        function ()
        {

          console.log( 'error getting permits' );
          // do something with the error here
          // need to figure out how to detect if something wasn't found
          // versus an error.
          InspSched.UI.Hide( 'Searching' );

          return false;
        });
      console.log( "PermitNo: " + PermitSearchField.value );
      if ( PermitSearchField.value != "" )
      {
        //LoadInspectionDates( );
      }


    }

    permitNumSelect.onchange = function ()
    {
      let permits = InspSched.CurrentPermits;
      // TODO: Add code to check if there is a selected date;
      SaveInspectionButton.setAttribute( "disabled", "disabled" );

      InspSched.UI.GetInspList( permitNumSelect.value );
      console.log( "PermitNumSelect onchange: " );
      console.log( permits );

      for (let permit of permits )
      {
        console.log( "In for loop selecting permits. Permit #" + permit.PermitNo );
        if ( permit.PermitNo == permitNumSelect.value )
        {
          console.log( "Build Calendar for Permit #" + permitNumSelect.value );
          BuildCalendar( permit.ScheduleDates );
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

      let thisPermit: string = permitNumSelect.value;
      let thisInspCd: string = SaveInspectionButton.getAttribute( "value" );
      let IssuesDiv: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'NotScheduled' ) );
      IssuesDiv.style.display = "none";
      InspSched.UI.clearElement( IssuesDiv );


      newInsp = new NewInspection( thisPermit, thisInspCd, $( dpCalendar ).data( 'datepicker' ).getDate() );
      $( dpCalendar ).data( 'datepicker' ).clearDates();

      console.log( "In SaveInspection onchangedate: \"" + $( dpCalendar ).data( 'datepicker' ).getDate() + "\"" );

      var e = transport.SaveInspection( newInsp ).then( function ( issues: Array<string> )
      {

        let thisHeading: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( 'h5' ) );
        let IssueList: HTMLUListElement = ( <HTMLUListElement>document.createElement( 'ul' ) );

        if ( issues != null) 
        {
          thisHeading.innerText = "The following issue(s) prevented scheduling the requested inspection:";
          thisHeading.className = "large-12 medium-12 small-12 row";
          IssuesDiv.appendChild( thisHeading );

          if ( issues.length > 0 )
          {

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
          
        }
        else
        {
          let thisIssue: HTMLLIElement = ( <HTMLLIElement>document.createElement( 'li' ) );
          thisIssue.textContent = "There is an issue saving the requested inspection. Please contact the Building Department " +
           "for assistance at 904-284-6307." ;
          thisIssue.style.marginLeft = "2rem;";
          console.log( "This is a significant error");
          IssueList.appendChild( thisIssue );
          
        }

        return true;

      }, function ()
        {
          console.log( 'error in Saving Inspection' );
          return false;
     });


    }

  } //  END start()
  
  function LoadData()
  {
    SaveInspectionButton.setAttribute( "disabled", "disabled" );
    IssuesDiv.style.display = "none";
    SaveInspectionButton.setAttribute( "disabled", "disabled" );

    LoadInspectionTypes();

  }

  function LoadInspectionTypes()
  {
    
    transport.GetInspType().then(function (insptypes: Array<InspType>)
    {
      InspSched.InspectionTypes = insptypes;
      console.log('InspectionTypes', InspSched.InspectionTypes);
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
  
  function BuildCalendar(dates: Array<string>)
  {
    $( dpCalendar ).datepicker( 'destroy' );

    $( document ).foundation();

    //
    let additionalDisabledDates: string []= GetAdditionalDisabledDates( dates );

    InspSched.InspectionDates = dates;
    InspSched.firstDay = InspSched.InspectionDates[0];
    InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];

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

}