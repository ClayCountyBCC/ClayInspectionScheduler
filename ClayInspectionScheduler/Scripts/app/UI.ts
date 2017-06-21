/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />



namespace InspSched.UI
{
  "use strict";
  export let CurrentPermits: Array<Permit> = new Array<Permit>();
  export let CurrentInspections: Array<Inspection> = [];

  export function Search( key: string )
  {
    clearElement( document.getElementById( 'SearchFailed' ) );
    Hide( 'PermitSelectContainer' );
    Hide( 'CurrentPermitData' )
    Hide( 'InspectionScheduler' );
    Hide( 'CurrentPermit' )
    Hide( 'InspectionTable' );
    Show( 'Searching' );
    Hide( 'SearchFailed' );
    Hide( 'SuspendedContractor' );

    let k: string = key.trim().toUpperCase();
    document.getElementById( 'PermitSearch' ).setAttribute( "value", k );

    if ( k.length == 8 && !isNaN( Number( k ) ) )
    {
      return k;
    }
    else
    {
      Hide( 'Searching' );

      UpdateSearchFailed( key );

      return null;
    }
  }

  export function ProcessResults( permits: Array<Permit>, key: string )
  {
    let tbl: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspectionTable' ) );
    AddPermit( permits, key );
    UpdatePermitData( key, permits );
    
    if ( permits.length == 0 ) 
    {
      UpdateSearchFailed( key );
    }
    else 
    {
      Hide( 'Searching' );
      document.getElementById( 'CurrentPermitData' ).style.display = "block";
      ShowTable( key, permits );

    }
  }

  /**********************************
    
    Build Option List
  
  **********************************/

  function GetPermitList( key: string, permit?: Permit )
  {

    transport.GetPermit( key ).then( function ( permits: Array<Permit> )
    {

      CurrentPermits = permits;
      InspSched.CurrentPermits = permits
      ProcessResults( permits, key );

      return true;

    },
      function ()
      {
        console.log( 'error in GetPermits' );
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        Hide( 'Searching' );

        return false;
      });
  }

  function AddPermit( permits: Array<Permit>, key: string )
  {
    let container: HTMLElement = ( <HTMLElement>document.getElementById( 'PermitSelect' ) );
    clearElement( container );

    let current = buildPermitSelectOptGroup( "Search Results", "current" );
    let related = buildPermitSelectOptGroup( "Related Permits", "related" );
    container.appendChild( current );
    if ( permits.length > 1 )
    {
      container.appendChild( related );
    }
    
    for ( let permit of permits )
    {
      if ( permit.PermitNo == key )
      {
        current.appendChild( buildPermitSelectOption( permit, key ) );
        GetInspList( key, permit );

      }
      else
      {
        if ( permits.length > 1 )
          related.appendChild( buildPermitSelectOption( permit, key ) );
      }
    }
  }

  export function UpdatePermitData( key: string, permits?: Array<Permit> ): void
  {

    let street: HTMLElement = ( <HTMLElement>document.getElementById( 'ProjAddrCombined' ) );
    let city: HTMLElement = ( <HTMLElement>document.getElementById( 'ProjCity' ) );

    for ( let permit of permits )
    {
      if ( permit.PermitNo == key ) 
      {
        Show( 'PermitSelectContainer' );
        street.innerHTML = permit.ProjAddrCombined.trim();
        city.innerHTML = permit.ProjCity.trim();
        break;
      }
    }
  }

  function buildPermitSelectOptGroup( lbl: string, val: string ): HTMLElement
  {
    //let og = document.createElement( "optgroup" );
    let og = document.createElement( "optgroup" );
    og.label = lbl;
    og.value = val;

    return og;
  }

  function createOptGroupElement( value: string, className?: string ): HTMLElement
  {
    let og = document.createElement( "optgroup" );
    if ( className !== undefined )
    {
      og.className = className;

    }

    og.label = value;
    og.appendChild( document.createTextNode( value ) );
    return og;
  }

  function buildPermitSelectOption( permit: Permit, key: string ): HTMLElement
  {

    let label: string = getInspTypeString( permit.PermitNo[0] );
    let option: HTMLOptionElement = ( <HTMLOptionElement>document.createElement( "option" ) );

    option.setAttribute( "value", permit.PermitNo.trim() );
    option.setAttribute( "label", permit.PermitNo + "  (" +  label + ")" );
    option.setAttribute( "title", permit.PermitNo.trim() );
    option.textContent = permit.PermitNo + "  (" + label + ")";

    option.id = permit.PermitNo + permit.CanSchedule;

    if ( permit.PermitNo == key )
    {

      option.value = permit.PermitNo.trim();
      option.selected = true;
    }
    else
    {
      option.value = permit.PermitNo.trim();
      option.selected = false;
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

  export function GetInspList( key: string, permit?: Permit )
  {
    document.getElementById( 'InspectionScheduler' ).removeAttribute( "value" );
    var saveButton: HTMLElement = ( <HTMLElement>document.getElementById( 'SaveSchedule' ) );
    if ( saveButton != undefined )
    {
      saveButton.setAttribute( "disabled", "disabled" );
      saveButton.removeAttribute( "value" );
    }
    let completed: number = 0;
    let canSchedule: boolean = true;
    Hide( 'InspSched' );
    Hide( 'InspListHeader' );
    Hide( 'InspListData' );
    Hide( 'InspectionScheduler' );
    Hide( 'SuspendedContractor' );
    document.getElementById( 'FutureInspRow' ).removeAttribute( "value" );
    clearElement( document.getElementById( 'InspListData' ) );

    transport.GetInspections( key ).then( function ( inspections: Array<Inspection> )
    {
      if ( inspections.length > 0 )
      {
        CurrentInspections = inspections;
        BuildInspectionList( CurrentInspections, permit );
      }
      else
      {
        BuildScheduler( inspections, canSchedule, completed, key );
        document.getElementById( 'PermitScreen' ).style.display = "flex";
      }
      return true;
    }, function ()
      {
        console.log( 'error getting inspections' );
        return false;
      });
  }

  export function BuildInspectionList( inspections: Array<Inspection>, permit?: Permit )
  {
    let completed: number = 0;
    let NumFutureInsp: number = 0;

    let canSchedule: boolean = true;
    // Initialize element variable for list container 'InspListData'
    let InspList: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspListData' ) );
    let InspHeader: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspListHeader' ) );
    let empty: HTMLElement = ( <HTMLElement>document.createElement( "tr" ) );
    clearElement( document.getElementById( 'FutureInspRow' ) );
    
    // TODO: add Try/Catch
    if ( inspections.length > 0 )
    {
      // create (call BuildInspectioN()) and add inspection row to container InspList
      for ( let inspection of inspections )
      {
        if ( inspection.ResultADC )
        {
          if ( completed < 5 )
          {
            InspList.appendChild( BuildCompletedInspection( inspection) );
            InspList.appendChild( document.createElement( "hr" ) );
            completed++;
          }
        }
        else if ( !inspection.ResultADC )
        {

          NumFutureInsp++;
          BuildFutureInspRow( inspection, NumFutureInsp, InspSched.ThisPermit.IsExternalUser);
        }

      }

      if ( NumFutureInsp )
      {
        document.getElementById( 'FutureInspRow' ).setAttribute( "value", inspections[0].PermitNo );
      }

      if ( completed > 0 )
      {
        InspHeader.style.removeProperty( "display" );
        InspList.style.removeProperty( "display" );

      }

      document.getElementById( 'PermitScreen' ).style.display = "flex";
    }

    var passedFinal = false;
    for ( let i of inspections )
    {
      var isFinalInspection = i.InsDesc.toLowerCase();

      if ( isFinalInspection.search( "final" ) != -1
          && (i.ResultADC == 'A'
          || i.ResultADC == 'P' ) ) 
      {
        passedFinal = true;
      }

    }

    if ( passedFinal )
    {
      permitSchedulingIssue( inspections[0].PermitNo );
    }
    else
    {
      BuildScheduler( inspections, canSchedule, completed );
    }


  }

  function BuildCompletedInspection( inspection: Inspection )
  {

    let inspRow: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspRow.className = "row large-12";
    let inspDateTime: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspDateTime.textContent = inspection.DisplayInspDateTime.trim();
    inspDateTime.className = "large-3 medium-2 small-12 inspDate ";
    inspRow.appendChild( inspDateTime );

    let inspDesc: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspDesc.textContent = inspection.InsDesc.trim();
    inspDesc.className = "large-8 medium-8 small-9 inspType ";
    inspRow.appendChild( inspDesc );

    let ResultADC: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    ResultADC.textContent = inspection.ResultDescription.trim();
    ResultADC.className = "large-1 medium-1 small-1 inspResult";
    ResultADC.style.textAlign = "center";
    inspRow.appendChild( ResultADC );

    if ( inspection.ResultADC == 'F' || inspection.ResultADC == 'D' ||  inspection.ResultADC == 'N' )
    {
      let Remarks: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );

      if ( inspection.Remarks !== null || inspection.Remarks === "" )
      {
        Remarks.textContent = "Remarks: " + inspection.Remarks.trim();
        
      }
      else
      {
        Remarks.textContent = "No remarks entered by the inspector. Please contact the Building Department " +
                              "at 904-284-6307 or contact the inspector " +
                              "directly for assistance.";
      }
       
      Remarks.className = "large-12 medium-12 small-12 inspRemarks";
      inspRow.appendChild( Remarks );
    }

    return inspRow;
  }

  function BuildFutureInspRow( inspection: Inspection, numFutureInsp: number, IsExternalUser: boolean )
  {
    let schedBody: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'InspSchedBody' ) );
    let futureRow: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'FutureInspRow' ) );
    let thisinsp: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let dateName: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspDate: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspType: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspInspector: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspCancelDiv: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspCancelButton: HTMLButtonElement = ( <HTMLButtonElement>document.createElement( "button" ) );

    thisinsp.setAttribute( "id", inspection.InspReqID + "_" + numFutureInsp );

    thisinsp.className = "InspBorderBottom large-12 medium-12 small-12 row";

    thisinspDate.className = "large-2 medium-2 small-4 column align-center column";
    thisinspType.className = "large-5 medium-4 small-8 column align-center column ";
    thisinspInspector.className = "large-3 medium-4 hide-for-small-only end column align-center";

    thisinspCancelDiv.className = "large-2 medium-2 small-12 column flex-container align-center";
    thisinspCancelButton.className = " button";

    thisinspDate.innerText = inspection.DisplaySchedDateTime;
    thisinspType.innerText = inspection.InsDesc;
    thisinspInspector.innerText = inspection.InspectorName;
    thisinspCancelButton.innerText = "Cancel";

    document.getElementById( 'InspSched' ).style.removeProperty( "display" );
    document.getElementById( 'FutureInspRow' ).style.removeProperty( "display" );

    thisinspCancelButton.setAttribute( "onclick",

      // cancels inspection then re-fetch inspections
      "InspSched.UI.CancelInspection(\"" + inspection.InspReqID + "\", \"" + inspection.PermitNo + "\");" + 
      
      // clears Calendar of any chosen dates
      "$( '#sandbox-container div' ).data( 'datepicker' ).clearDates();" + 

      // Hide scheduling issue div
      "document.getElementById(\"NotScheduled\").style.display = \"none\"" ); 

    if ( IsGoodCancelDate( inspection, IsExternalUser )  )
      thisinspCancelDiv.appendChild( thisinspCancelButton );


    thisinsp.appendChild( thisinspDate );
    thisinsp.appendChild( thisinspType );
    thisinsp.appendChild( thisinspInspector );

    thisinsp.appendChild( thisinspCancelDiv );

    futureRow.appendChild( thisinsp );

    schedBody.style.removeProperty( "display" );

  }

  /**********************************************
   *
   * Build Scheduler
   * Get and build select list of inspections@
   * 
   *********************************************/

  function BuildScheduler( inspections: Array<Inspection>, canSchedule: boolean, completed: number, key?: string )
  {

    if ( inspections.length > 0 )
      key = inspections[0].PermitNo;

    if ( canSchedule )
    {
      let fail: HTMLElement = ( <HTMLElement>document.getElementById( key + "FAIL" ) );
      let pass: HTMLElement = ( <HTMLElement>document.getElementById( key + "PASS" ) );

      // if contractor IS ALLOWED to schedule, the contractor id will be on the list
      if ( pass )
      {

        // Populate Inspection Type Select list
        LoadInspTypeSelect( key );
        document.getElementById( 'InspectionScheduler' ).style.removeProperty( "display" );
        document.getElementById( 'InspectionScheduler' ).setAttribute( "value", key );

      }

      // if contractor IS NOT ALLOWED to schedule inspection, the list will be empty
      else
      {
        permitSchedulingIssue(key);
      }

    }

  }

  function LoadInspTypeSelect( key: string )
  {
    let thistype: string = key[0];
    var label: string = getInspTypeString( thistype );

    let InspTypeList: HTMLSelectElement = ( <HTMLSelectElement>document.getElementById( 'InspTypeSelect' ) );
    let optionLabel: HTMLOptionElement = ( <HTMLOptionElement>document.createElement( "option" ) );

    clearElement( InspTypeList );
    optionLabel.textContent = label + " Inspections:";
    //optionLabel.label += label +" Inspections:";
    //optionLabel.innerText = optionLabel.label;
    optionLabel.className = "selectPlaceholder";
    optionLabel.selected;
    optionLabel.value = "";
    InspTypeList.appendChild( optionLabel );

    for ( let type of InspSched.InspectionTypes )
    {
      if ( type.InspCd[0] == thistype )
      {
        let option: HTMLOptionElement = <HTMLOptionElement>document.createElement( "option" );
        option.label = type.InsDesc;
        option.value = type.InspCd;
        option.className = "TypeSelectOption";
        InspTypeList.appendChild( option );
        option.innerText = type.InsDesc;
      }
    }
  }

  /**********************************
  
    Do Somethings
  
  ***********************************/
  function getInspTypeString(InspType: string)
  {
    switch ( InspType )
    {
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
        return "Unknown"
    }

  }

  export function Show( id?: string, element?: HTMLElement, displayType?: string ): void
  {
    if ( !element )
    {
      let e = document.getElementById( id );
      if ( displayType == null )
        e.style.display = "block";
      else
        e.style.display = displayType;
    }
    else
    {
      let e = document.getElementById( id );
      if ( displayType == null )
        element.style.display = "block";
      else
        element.style.display = displayType;
    }
  }

  export function Hide( id: string ): void
  {

    let e = document.getElementById( id );
    if ( e )
      e.style.display = "none";
  }

  // this function emptys an element of all its child nodes.
  export function clearElement( node: HTMLElement ): void
  {
    while ( node.firstChild )
    {
      node.removeChild( node.firstChild );
    }
  }

  function ShowTable( key: string, permits?: Array<Permit> )
  {
    let inspectionTable: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspectionTable' ) );
    if ( permits )
    {
      Hide( 'Searching' );
      inspectionTable.style.removeProperty( "display" );

    }
  }

  function UpdateSearchFailed( key: string ): void
  {

    let e: HTMLElement = document.getElementById( 'SearchFailed' );
    clearElement( e );
    let message: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( "h3" ) );

    if ( !isNaN( Number( key ) ) && key.length == 8 )
    {
      message.appendChild( document.createTextNode( "Permit #" + key + " not found" ) );
    }
    else if ( !isNaN( Number( key ) ) && key.length > 0 && key.length != 8  )
    {
      message.innerHTML = "\"" + key + "\" is not a valid Permit Number";

    }
    else if ( key.length == 0 )
    {
      message.innerHTML = "You did not enter any information.<br />Enter a valid permit number and click search.";

    }
    else
    {
      message.innerHTML = "Invalid Entry<br />";
    }
    message.style.textAlign = "center";
    e.appendChild( message );

    Hide( 'Searching' );
    Show( 'SearchFailed' );
  }

  export function CancelInspection( InspID?: string, key?: string )
  {
    if ( InspID && key )
    {
      //Hide( 'FutureInspRow' );
      // TODO: Add function to not allow cancel if scheduled date of insp is current date 

      var isDeleted = transport.CancelInspection( InspID, key );

      // TODO: ADD code to inform user if the inspection has been deleted 

      // Reload inspection list after delete
      if ( isDeleted )
      {
        GetInspList( key );
      }

      else
      {
        //display notification of failed delete

      }
    }
    else
    {
      document.getElementById( 'InspSched' ).style.display = "none";
    }
  }

  function IsGoodCancelDate(inspection: Inspection, IsExternalUser: boolean): boolean
  {
    let tomorrow = new Date();
    let inspDate = new Date( inspection.DisplaySchedDateTime );
    var dayOfMonth = tomorrow.getDate()+1;
    //today.setDate( dayOfMonth - 20 );

    if ( inspDate < tomorrow && IsExternalUser )
      return false;

    return true;
  }

  function permitSchedulingIssue(key: string)
  {
    let InspTypeList: HTMLSelectElement = ( <HTMLSelectElement>document.getElementById( 'InspTypeSelect' ) );
    clearElement( InspTypeList );
    let e: HTMLElement = document.getElementById( 'SuspendedPermit' );
    clearElement( e );
    let message: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( "h5" ) );
    message.appendChild( document.createTextNode( "A new inspection cannot be scheduled for permit #" + key + "." ) );
    message.appendChild( document.createElement( "br" ) );
    message.appendChild( document.createElement( "br" ) );

    message.appendChild( document.createTextNode(

      "\nPlease contact the Building Department " +
      "for assistance at 904-284-6307.  There are multiple " +
      "reasons an inspections may not " +
      "be scheduled on-line " +
      "(fees due, permit problems, holds, or licensing issues)."

    ) );

    e.appendChild( message );
    document.getElementById( 'SuspendedContractor' ).style.removeProperty( "display" );
  }
}