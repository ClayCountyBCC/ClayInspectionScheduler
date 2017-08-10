/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />



namespace InspSched.UI
{
  "use strict";
  export let CurrentPermits: Array<Permit> = new Array<Permit>();
  export let CurrentInspections: Array<Inspection> = [];
  export let PermitsWithOutInsp: Array<string> = [];


  export function Search(key: string)
  {
    clearElement(document.getElementById('SearchFailed'));
    Hide('PermitSelectContainer');
    Hide('CurrentPermitData')
    Hide('CurrentPermit')
    Hide('InspectionTable');
    Hide('SearchFailed');
    Hide('SuspendedContractor');
    Hide('NoInspContainer');
    Hide('NotScheduled');
    Show('Searching');
    
    let k: string = key.trim().toUpperCase();
    document.getElementById('PermitSearch').setAttribute("value", k);

    if (k.length == 8 && !isNaN(Number(k)))
    {
      return k;
    }
    else
    {
      Hide('Searching');

      UpdateSearchFailed(key);

      return null;
    }
  }

  export function ProcessResults(permits: Array<Permit>, key: string)
  {
    let tbl: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspectionTable'));
    AddPermit(permits, key);
    UpdatePermitData(key, permits);

    if (permits.length == 0) 
    {
      UpdateSearchFailed(key);
    }
    else 
    {
      Hide('Searching');
      document.getElementById('CurrentPermitData').style.display = "block";
      ShowTable(key, permits);

    }
  }

  /**********************************
    
    Build Option List
  
  **********************************/

  function GetPermitList(key: string, permit?: Permit)
  {

    transport.GetPermit(key).then(function (permits: Array<Permit>)
    {

      CurrentPermits = permits;
      InspSched.CurrentPermits = permits
      ProcessResults(permits, key);

      return true;

    },
      function ()
      {
        console.log('error in GetPermits');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        Hide('Searching');

        return false;
      });
  }

  function AddPermit(permits: Array<Permit>, key: string)
  {
    let container: HTMLElement = (<HTMLElement>document.getElementById('PermitSelect'));
    clearElement(container);

    let current = buildPermitSelectOptGroup("Search Results", "current");
    let related = buildPermitSelectOptGroup("Related Permits", "related");
    container.appendChild(current);
    if (permits.length > 1)
    {
      container.appendChild(related);
    }

    for (let permit of permits)
    {
      if (permit.PermitNo == key)
      {
        current.appendChild(buildPermitSelectOption(permit, key));
        GetInspList(key, permit);

      }
      else
      {
        if (permits.length > 1)
          related.appendChild(buildPermitSelectOption(permit, key));
      }
    }
  }

  export function UpdatePermitData(key: string, permits?: Array<Permit>): void
  {

    let street: HTMLElement = (<HTMLElement>document.getElementById('ProjAddrCombined'));
    let city: HTMLElement = (<HTMLElement>document.getElementById('ProjCity'));

    for (let permit of permits)
    {
      if (permit.PermitNo == key) 
      {
        Show('PermitSelectContainer');
        street.innerHTML = permit.ProjAddrCombined.trim();
        city.innerHTML = permit.ProjCity.trim();
        break;
      }
    }
  }

  function buildPermitSelectOptGroup(lbl: string, val: string): HTMLElement
  {
    //let og = document.createElement( "optgroup" );
    let og = document.createElement("optgroup");
    og.label = lbl;
    og.value = val;

    return og;
  }

  function createOptGroupElement(value: string, className?: string): HTMLElement
  {
    let og = document.createElement("optgroup");
    if (className !== undefined)
    {
      og.className = className;

    }

    og.label = value;
    og.appendChild(document.createTextNode(value));
    return og;
  }

  function buildPermitSelectOption(permit: Permit, key: string): HTMLElement
  {

    let label: string = getInspTypeString(permit.PermitNo[0]);
    let option: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    option.setAttribute("value", permit.PermitNo.trim());
    option.setAttribute("label", permit.PermitNo + "  (" + label + ")");
    option.setAttribute("title", permit.PermitNo.trim());
    option.appendChild(document.createTextNode(permit.PermitNo + "  (" + label + ")" ));

    option.id = "select_" + permit.PermitNo;

    if (permit.PermitNo == key)
    {

      option.value = permit.PermitNo.trim();
      option.selected = true;
    }
    else
    {
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

  export function GetInspList(key: string, permit?: Permit)
  {
    
    document.getElementById('InspectionScheduler').removeAttribute("value");
    var saveButton: HTMLElement = (<HTMLElement>document.getElementById('SaveSchedule'));
    if (saveButton != undefined)
    {
      saveButton.setAttribute("disabled", "disabled");
      saveButton.removeAttribute("value");
    }
    let completed: number = 0;
    let canSchedule: boolean = true;
    Hide('InspSched');
    Hide('InspListHeader');
    Hide('InspListData');
    Hide('NoInspContainer');
    Hide('SuspendedContractor');

    clearElement(document.getElementById('InspListData'));
  
    transport.GetInspections(key).then(function (inspections: Array<Inspection>)
    {
      if (inspections.length > 0)
      {
        InspSched.CurrentInspections = inspections;
        BuildInspectionList(InspSched.CurrentInspections, permit);
      }
      else
      {
        // TODO: add 'NO INSPECTIONS ERROR'
        document.getElementById('NoInspections').style.display = "flex";
        document.getElementById("InspSched").style.display = "flex";
        document.getElementById('PermitScreen').style.display = "flex";

      }
      BuildScheduler(InspSched.CurrentInspections, key);

      return true;
    }, function ()
      {
        console.log('error getting inspections');
        return false;
      });
  }

  export function BuildInspectionList(inspections: Array<Inspection>, permit?: Permit)
  {

    // Initialize element variable for list container 'InspListData'
    let InspList: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspListData'));
    let empty: HTMLElement = (<HTMLElement>document.createElement("tr"));

    // TODO: add Try/Catch

    // create (call BuildInspectioN()) and add inspection row to container InspList
    console.log('inspections', inspections);
    for (let inspection of inspections)
    {
      InspList.appendChild(BuildInspectionRow(inspection));
    }

    InspList.style.removeProperty("display");

    document.getElementById("InspSched").style.removeProperty("display");
    document.getElementById('PermitScreen').style.display = "flex";

  }
  
  // update BuildInspectionRow
  function BuildInspectionRow(inspection: Inspection)
  {
    // create variables and get/create document elements
    let inspRow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));

    let dataColumn: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let remarkrow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let remarkColumn: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));

    let thisPermit: HTMLDivElement = (<HTMLDivElement>document.createElement('div'));
    let inspDateTime: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let inspDesc: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let inspector: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let InspButtonDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let Remarks: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    let ResultADC: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));

    // Set element classes 
    dataColumn.className = "large-10 medium-10 small-12 ";
    remarkColumn.className = "large-10 medium-10 small-12 ";

    if (inspection.ResultADC == null || inspection.ResultADC == "")
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
    else if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
    else if (inspection.ResultADC == 'C')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow"
    else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";

    thisPermit.className = "large-2 medium-6 small-6 column InspPermit ";
    inspDateTime.className = "large-2 medium-6 small-6 column InspDate";
    inspector.className = "large-3 medium-6 small-12 InspResult column end";
    InspButtonDiv.className = "ButtonContainer large-2 medium-2 small-12 flex-container align-center ";
    Remarks.className = "large-9 medium-6 small-6 inspRemarks column";
    ResultADC.className = "large-3 medium-6 small-6 InspResult column end";


    // add the text nodes
    thisPermit.appendChild(document.createTextNode(inspection.PermitNo));
    if (inspection.DisplayInspDateTime.toLowerCase() == 'incomplete')
    {
      inspDateTime.appendChild(document.createTextNode(inspection.DisplaySchedDateTime));
    }
    else
    {
      inspDateTime.appendChild(document.createTextNode(inspection.DisplayInspDateTime));
    }
    inspDesc.appendChild(document.createTextNode(inspection.InsDesc.trim()));
    Remarks.appendChild(document.createTextNode("Remarks: " + (inspection.Remarks !== null && inspection.Remarks === "" ? inspection.Remarks.trim() : "N/A")));
    ResultADC.appendChild(document.createTextNode(inspection.ResultDescription.trim()));
    inspector.appendChild(document.createTextNode(inspection.InspectorName.trim()));


    //Create function to make New/Cancel Button
    let permit: Permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === inspection.PermitNo })[0];
    if (!permit.ErrorText && (inspection.ResultADC || inspection.DisplaySchedDateTime.length === 0))
    {
      let buttonId: string = "CreateNew_" + inspection.PermitNo;
      console.log('button status', document.getElementById(buttonId));
      if (!document.getElementById(buttonId))
      {
        InspButtonDiv.appendChild(BuildButton(buttonId, "New", "InspSched.UpdatePermitSelectList('" + inspection.PermitNo + "');"));
      }

    }
    else if (!inspection.ResultADC)
    {
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


    if (inspection.DisplayInspDateTime.length > 0)
    {
      if (inspection.InspReqID !== "99999999")
      {
 
        inspDesc.className = "large-5 medium-6 small-6  InspType column";

        remarkrow.className = " large-12 medium-12 small-12 row flex-container";
        remarkColumn.appendChild(Remarks);
        remarkColumn.appendChild(ResultADC);
        remarkrow.appendChild(remarkColumn);

      }
      else
      {
        inspector.style.display = 'none';
        inspDateTime.style.display = 'none';
        inspDesc.className = "large-10 medium-6 small-6 InspType InspResult column";
      }

    }



    return inspRow;

  }

  function BuildButton(buttonId: string, label: string, functionCall: string): HTMLButtonElement
  {
    let InspButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
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

  export function BuildScheduler(inspections: Array<Inspection>, key: string)
  {
    
    // Populate Inspection Type Select list
    LoadInspTypeSelect(key);
    InspSched.BuildCalendar(InspSched.ThisPermit.ScheduleDates, InspSched.ThisPermit.ErrorText);

    document.getElementById('InspectionScheduler').setAttribute("value", key);
      
  }

  export function LoadInspTypeSelect(key: string)
  {

    let thistype: string = key[0];
    var label: string = getInspTypeString(thistype);

    let InspTypeList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById('InspTypeSelect'));
    let optionLabel: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    clearElement(InspTypeList);
    optionLabel.appendChild(document.createTextNode(label + " Inspections:"));

    optionLabel.className = "selectPlaceholder";
    optionLabel.selected;
    optionLabel.value = "";
    InspTypeList.appendChild(optionLabel);

    for (let type of InspSched.InspectionTypes)
    {
      if (type.InspCd[0] == thistype)
      {
        let option: HTMLOptionElement = <HTMLOptionElement>document.createElement("option");
        option.label = type.InsDesc;
        option.value = type.InspCd;
        option.className = "TypeSelectOption";
        InspTypeList.appendChild(option);
        option.appendChild(document.createTextNode(type.InsDesc));
      }
    }
  }

  /**********************************
  
    Do Somethings
  
  ***********************************/
  function getInspTypeString(InspType: string)
  {
    switch (InspType)
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

  export function Show(id?: string, element?: HTMLElement, displayType?: string): void
  {
    if (!element)
    {
      let e = document.getElementById(id);
      if (e.style.display != null)
      {
        if (displayType == null)
          e.style.display = "block";
        else
          e.style.display = displayType;
      }
    }
    else
    {
      let e = document.getElementById(id);
      if (displayType == null)
        element.style.display = "block";
      else
        element.style.display = displayType;
    }
  }

  export function Hide(id: string): void
  {

    let e = document.getElementById(id);
    if (e)
      e.style.display = "none";
  }

  // this function emptys an element of all its child nodes.
  export function clearElement(node: HTMLElement): void
  {
    while (node.firstChild)
    {
      node.removeChild(node.firstChild);
    }
  }

  function ShowTable(key: string, permits?: Array<Permit>)
  {
    let inspectionTable: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspectionTable'));
    if (permits)
    {
      Hide('Searching');
      inspectionTable.style.removeProperty("display");

    }
  }

  function UpdateSearchFailed(key: string): void
  {

    let e: HTMLElement = document.getElementById('SearchFailed');
    clearElement(e);
    let message: HTMLHeadingElement = (<HTMLHeadingElement>document.createElement("h3"));

    if (!isNaN(Number(key)) && key.length == 8)
    {
      message.appendChild(document.createTextNode("Permit #" + key + " not found"));
    }
    else if (!isNaN(Number(key)) && key.length > 0 && key.length != 8)
    {
      message.innerHTML = "\"" + key + "\" is not a valid Permit Number";

    }
    else if (key.length == 0)
    {
      message.innerHTML = "You did not enter any information.<br />Enter a valid permit number and click search.";

    }
    else
    {
      message.innerHTML = "Invalid Entry<br />";
    }
    message.style.textAlign = "center";
    e.appendChild(message);

    Hide('Searching');
    Show('SearchFailed');
  }

  export function InformUserOfError(permitno: string, error: string): void
  {
    Hide("InspectionScheduler");
    clearElement(document.getElementById('InspTypeSelect'));

    let reasons: HTMLDivElement = (<HTMLDivElement>document.getElementById('Reasons'));
    clearElement(reasons);
    let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
    clearElement(thisHeading);

    let IssueList: HTMLUListElement = (<HTMLUListElement>document.createElement('ul'));
    let thisIssue: HTMLLIElement = (<HTMLLIElement>document.createElement('li'));

    thisHeading.appendChild(document.createTextNode("The following issue is preventing the ability to schedule an inspection:"));

    thisIssue.appendChild(document.createTextNode(error));
    thisIssue.style.marginLeft = "2rem;";

    IssueList.appendChild(thisIssue);
    reasons.appendChild(IssueList);
    document.getElementById("NotScheduled").style.display = "flex";
    
  }

  function IsGoodCancelDate(inspection: Inspection, IsExternalUser: boolean): boolean
  {
    let tomorrow = new Date();
    let inspDate = new Date(inspection.DisplaySchedDateTime);
    var dayOfMonth = tomorrow.getDate() + 1;

    if (inspDate < tomorrow && IsExternalUser)
      return false;

    return true;
  }

}