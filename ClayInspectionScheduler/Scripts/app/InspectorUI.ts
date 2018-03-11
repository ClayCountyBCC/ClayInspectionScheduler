/// <reference path="app.ts" />
/// <reference path="inspection.ts" />
/// <reference path="shortinspection.ts" />


namespace InspSched.InspectorUI
{

  export function LoadDailyInspections()
  {
    transport.DailyInspections().then(function (inspections: Array<Inspection>)
    {
      InspSched.IVInspections = inspections;
      console.log('inspections', inspections);
      if (InspSched.IVInspections.length > 0)
      {
        if (InspSched.Inspectors.length === 0)
        {
          LoadInspectors();
        }
        
        BuildInspectorUI();
      }
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        InspSched.IVInspections = [];
      });
  }

  function ShowInspectionTab()
  {
    let e = document.getElementById("InspectorViewTab");
    e.style.display = "flex";
  }

  function LoadInspectors():void
  {
    transport.Inspectors().then(function (inspectors: Array<Inspector>)
    {
      let developmentcheck = (<HTMLSpanElement>document.getElementById("isDevelopment"));
      if (inspectors[0].InDevelopment)
      {
        developmentcheck.textContent = "Dev Environment";
      }
      

      InspSched.Inspectors = inspectors;

      PopulateInspectorDropdown();
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        InspSched.IVInspections = [];
      });
  }

  function PopulateInspectorDropdown(): void
  {
    let ddl = <HTMLSelectElement>document.getElementById('InspectorList');
    for (let i of InspSched.Inspectors)
    {
      let o = <HTMLOptionElement>document.createElement("option");
      o.value = i.Name;
      o.appendChild(document.createTextNode(i.Name));
      ddl.options.add(o);
    }
  }

  export function BuildInspectorUI()
  {
    ShowInspectionTab(); // this shows the Inspector View Tab thinger
    // this function will take the 
    // IV data and create the html
    // and add it to the InspectorViewInspections div
    if (InspSched.HideTheseComments.length === 0)
    {
      PopulateBadComments();
    }
    let target = document.getElementById("InspectorViewInspections");
    UI.clearElement(target);
    let currentHash = new LocationHash(location.hash.substring(1));
    // Let's get our filters.
    let inspector: string = (<HTMLSelectElement>document.getElementById("InspectorList")).value;
    let day: string = (<HTMLInputElement>document.querySelector('input[name="day"]:checked')).value;
    let viewType: string = (<HTMLInputElement>document.querySelector('input[name="view"]:checked')).value;
    let open: string = (<HTMLInputElement>document.querySelector('input[name="status"]:checked')).value;
    // We're going to filter our results if a day or inspector was passed.
    let isOpen: boolean = open === "Open";

    if (viewType === "address")
    {
      InspSched.InspectorViewByAddress = ProcessIVInspectionsByAddress(InspSched.IVInspections, inspector, day, open, isOpen);
      console.log('inspectorviewbyaddress', InspSched.InspectorViewByAddress);
      BuildInspectorViewByAddress(target, currentHash);
    }
    else
    {
      InspSched.InspectorViewByPermit = ProcessIVInspectionsByPermit(InspSched.IVInspections, inspector, day, open, isOpen);
      BuildInspectorViewByPermit(target, currentHash);
    }
  }

  function BuildInspectorViewByAddress(target: HTMLElement, currentHash: LocationHash)
  {
    let df: DocumentFragment = document.createDocumentFragment();
    df.appendChild(BuildInspectorViewByAddressHeaderRow());
    if (InspSched.InspectorViewByAddress.length > 0)
    {
      for (let i of InspSched.InspectorViewByAddress)
      {
        df.appendChild(BuildInspectorViewByAddressRow(i, currentHash));
      }
    }
    target.appendChild(df);
  }

  function BuildInspectorViewByPermit(target:HTMLElement, currentHash: LocationHash)
  {
    let df: DocumentFragment = document.createDocumentFragment();
    df.appendChild(BuildInspectorViewByPermitHeaderRow());
    if (InspSched.InspectorViewByPermit.length > 0)
    {
      for (let i of InspSched.InspectorViewByPermit)
      {
        df.appendChild(BuildInspectorViewByPermitRow(i, currentHash));
      }
    }
    target.appendChild(df);
  }
  
  function BuildInspectorViewByPermitHeaderRow(): DocumentFragment  
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    let permit = CreateAndSet("Permit");
    let permitColumn = document.createElement("div");
    permitColumn.classList.add("flex-container");
    permitColumn.classList.add("columns");
    permitColumn.classList.add("align-middle");
    permitColumn.classList.add("align-center");
    permitColumn.appendChild(permit);
    row.appendChild(permitColumn);
    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-10");
    secondcolumn.classList.add("large-10");
    secondcolumn.classList.add("end");
    let firstRow = document.createElement("div");
    firstRow.classList.add("row");
    firstRow.classList.add("medium-12");
    firstRow.classList.add("large-12");
    firstRow.appendChild(CreateAndSet("Address", "columns", "small-4"));
    firstRow.appendChild(CreateAndSet("Inspector", "columns", "small-4"));
    firstRow.appendChild(CreateAndSet("GeoZone", "columns", "small-2"));
    firstRow.appendChild(CreateAndSet("FloodZone", "columns", "small-2"));
    secondcolumn.appendChild(firstRow);
    row.appendChild(secondcolumn);
    df.appendChild(row);
    return df;
  }

  function BuildInspectorViewByPermitRow(i: InspectionViewByPermit, ch: LocationHash): DocumentFragment
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("no-page-break");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    row.style.marginTop = ".5em";
    ch.Permit = i.PermitNumber;
    ch.InspectionId = 0;
    let permit = CreateLink(i.PermitNumber, ch.ToHash());
    let permitContainer = document.createElement("div");
    let permitContainerContainer = document.createElement("div");
    permitContainerContainer.classList.add("row");
    permitContainerContainer.classList.add("small-12");
    permitContainer.classList.add("flex-container");
    permitContainer.classList.add("small-12");
    permitContainer.classList.add("align-middle");
    permitContainer.classList.add("align-center");
    permitContainer.appendChild(permit);
    permitContainerContainer.appendChild(permitContainer);
    let permitColumn = document.createElement("div");
    permitColumn.classList.add("column");
    permitColumn.classList.add("medium-2");
    permitColumn.classList.add("align-middle");
    permitColumn.classList.add("align-center");
    permitColumn.classList.add("flex-container");
    if (i.IsPrivateProvider)
    {
      let pp = CreateAndSet("Private Provider");
      pp.classList.add("align-middle");
      pp.classList.add("small-12");
      pp.classList.add("align-center");
      pp.classList.add("flex-container");
      pp.style.fontSize = "smaller";
      permitContainerContainer.appendChild(pp);
    }
    permitColumn.appendChild(permitContainerContainer);
    row.appendChild(permitColumn);
    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-10");
    secondcolumn.classList.add("large-10");
    secondcolumn.classList.add("end");
    let firstRow = document.createElement("div");
    firstRow.classList.add("row");
    firstRow.classList.add("medium-12");
    firstRow.classList.add("large-12");
    firstRow.appendChild(CreateAndSet(i.Address, "columns", "small-4"));
    firstRow.appendChild(CreateAndSet(i.Inspector, "columns", "small-4"));
    firstRow.appendChild(CreateAndSet(i.GeoZone, "columns", "small-2"));
    firstRow.appendChild(CreateAndSet(i.FloodZone, "columns", "small-2"));
    secondcolumn.appendChild(firstRow);
    let secondRow = document.createElement("div");
    secondRow.classList.add("row");
    secondRow.classList.add("medium-12");
    secondRow.classList.add("large-12");
    for (let insp of i.Inspections)
    {
      ch.InspectionId = insp.InspectionId;
      secondRow.appendChild(CreateLink(insp.InspectionDesc, ch.ToHash(), "medium-4", "columns"));
    }
    secondcolumn.appendChild(secondRow);
    row.appendChild(secondcolumn);
    df.appendChild(row);
    return df;
  }

  function CreateAndSet(v: string, ...c: string[]): HTMLDivElement
  {
    let e = document.createElement("div");
    e.appendChild(document.createTextNode(v));
    if (c.length > 0)
    {
      for (let i of c)
      {
        e.classList.add(i); // optional class
      }
    }
    return e;
  }

  function CreateAndSetSmaller(v: string, ...c: string[])
  {
    let e = document.createElement("div");
    e.classList.add("align-middle");
    e.classList.add("small-12");
    e.classList.add("align-center");
    e.classList.add("flex-container");
    e.style.fontSize = "smaller";
    e.appendChild(document.createTextNode(v));
    if (c.length > 0)
    {
      for (let i of c)
      {
        e.classList.add(i); // optional class
      }
    }
    return e;
  }

  function CreateLink(v: string, l: string, ...c: string[]): HTMLAnchorElement
  {
    let a = document.createElement("a");
    a.href = l;
    a.appendChild(document.createTextNode(v));
    if (c.length > 0)
    {
      for (let i of c)
      {
        a.classList.add(i);
      }
    }
    return a;
  }

  export function ProcessIVInspectionsByPermit(
    inspections: Array<Inspection>,
    inspector: string,
    day: string,
    open: string,
    isOpen: boolean): Array<InspectionViewByPermit>
  {
    let ivList: Array<InspectionViewByPermit> = [];
    // if we have a day or inspector set to filter on
    // let's go ahead and filter the list of inspections
    // based on them.
    let d = new Date();
    let fInspections: Array<Inspection> = inspections.filter(
      function (i)
      {
        let inspectorCheck: boolean = inspector.length > 0 ? i.InspectorName === inspector : true;
        let dayCheck: boolean = day.length > 0 ? i.Day === day || ( day === "Today" && i.ResultADC === "" && new Date(i.SchedDateTime.toString()) < d) : true;

        let openCheck: boolean = true;
        if (open.length === 0)
        {
          openCheck = true;
        }
        else
        {
          if (isOpen)
          {
            openCheck = i.ResultADC.length === 0;
          }
          else
          {
            openCheck = i.ResultADC.length > 0;
          }
        }

        return inspectorCheck && dayCheck && openCheck;
      });
    // get a unique list of permit numbers.
    let permitNumbers: Array<string> = fInspections.map(
      function (p)
      {
        return p.PermitNo;
      });
    permitNumbers = permitNumbers.filter(function (value, index, self) { return index === self.indexOf(value) });

    // let's coerce the inspection data into the IV format.
    for (let p of permitNumbers)
    {
      let i = fInspections.filter(
        function (j)
        {
          return j.PermitNo === p;
        });
      let iv = new InspectionViewByPermit(i[0]); // we'll base the inspectorView off of the first inspection returned.
      iv.Inspections = i.map(function (insp)
      {
        return new ShortInspection(insp);
      });
      ivList.push(iv);
    }
    return ivList;
  }


  export function ProcessIVInspectionsByAddress(
    inspections: Array<Inspection>,
    inspector: string,
    day: string,
    open: string,
    isOpen: boolean): Array<InspectionViewByAddress>
  {

    let ivList: Array<InspectionViewByAddress> = [];
    // if we have a day or inspector set to filter on
    // let's go ahead and filter the list of inspections
    // based on them.
    let d = new Date();
    let fInspections: Array<Inspection> = inspections.filter(
      function (i)
      {
        let inspectorCheck: boolean = inspector.length > 0 ? i.InspectorName === inspector : true;
        let dayCheck: boolean = day.length > 0 ? i.Day === day || (day === "Today" && i.ResultADC === "" && new Date(i.SchedDateTime.toString()) < d) : true;

        let openCheck: boolean = true;
        if (open.length === 0)
        {
          openCheck = true;
        }
        else
        {
          if (isOpen)
          {
            openCheck = i.ResultADC.length === 0;
          }
          else
          {
            openCheck = i.ResultADC.length > 0;
          }
        }

        return inspectorCheck && dayCheck && openCheck;
      });
    // get a unique list of addresses.
    let addresses: Array<string> = fInspections.map(
      function (p)
      {
        return p.StreetAddress;
      });
    addresses = addresses.filter(function (value, index, self) { return index === self.indexOf(value) });
    console.log('addresses', addresses);

    // let's coerce the inspection data into the IV format.
    for (let a of addresses)
    {
      let i = fInspections.filter(
        function (j)
        {
          return j.StreetAddress === a;
        });
      let iv = new InspectionViewByAddress(i[0]); // we'll base the inspectorView off of the first inspection returned.
      iv.Inspections = i.map(function (insp)
      {
        return new ShortInspection(insp);
      });
      ivList.push(iv);
    }
    return ivList;
  }

  function BuildInspectorViewByAddressHeaderRow(): DocumentFragment  
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    let address = CreateAndSet("Address");
    let addressColumn = document.createElement("div");
    addressColumn.classList.add("flex-container");
    addressColumn.classList.add("columns");
    addressColumn.classList.add("medium-3");
    addressColumn.classList.add("align-middle");
    addressColumn.classList.add("align-center");
    addressColumn.appendChild(address);

    let inspector = CreateAndSet("Inspector");
    let inspectorColumn = document.createElement("div");
    inspectorColumn.classList.add("flex-container");
    inspectorColumn.classList.add("columns");
    inspectorColumn.classList.add("medium-2");
    inspectorColumn.classList.add("align-middle");
    inspectorColumn.classList.add("align-center");
    inspectorColumn.appendChild(inspector);
    row.appendChild(addressColumn);
    row.appendChild(inspectorColumn);
    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-7");
    secondcolumn.classList.add("large-7");
    secondcolumn.classList.add("end");
    let firstRow = document.createElement("div");
    firstRow.classList.add("row");
    firstRow.classList.add("medium-12");
    firstRow.classList.add("large-12");
    firstRow.appendChild(CreateAndSet("Permit", "columns", "small-4"));
    firstRow.appendChild(CreateAndSet("Type", "columns", "small-6"));
    firstRow.appendChild(CreateAndSet("Status", "columns", "small-2"));
    //firstRow.appendChild(CreateAndSet("Comments", "columns", "small-7"));
    secondcolumn.appendChild(firstRow);
    row.appendChild(secondcolumn);
    df.appendChild(row);
    return df;
  }

  function BuildInspectorViewByAddressRow(i: InspectionViewByAddress, ch: LocationHash): DocumentFragment
  {
    let df = document.createDocumentFragment();
    let row = document.createElement("div");
    row.classList.add("row");
    row.classList.add("no-page-break");
    row.classList.add("flex-container");
    row.classList.add("medium-12");
    row.classList.add("large-12");
    row.style.borderBottom = "solid 1px Black";
    row.style.marginTop = ".5em";
    ch.Permit = i.Address;
    ch.InspectionId = 0;
    let address = CreateAndSet(i.Address);
    let addressContainer = document.createElement("div");
    let addressContainerContainer = document.createElement("div");
    addressContainerContainer.classList.add("row");
    addressContainerContainer.classList.add("small-12");
    addressContainer.classList.add("flex-container");
    addressContainer.classList.add("small-12");
    addressContainer.classList.add("align-middle");
    addressContainer.classList.add("align-center");
    addressContainer.appendChild(address);
    addressContainerContainer.appendChild(addressContainer);
    let addressColumn = document.createElement("div");
    addressColumn.classList.add("column");
    addressColumn.classList.add("medium-3");
    addressColumn.classList.add("align-middle");
    addressColumn.classList.add("align-center");
    addressColumn.classList.add("flex-container");
    if (i.FloodZone.length > 0)
    {
      addressContainerContainer.appendChild(CreateAndSetSmaller("FloodZone: " + i.FloodZone + ", Geozone: " + i.GeoZone));
    }
    else
    {
      addressContainerContainer.appendChild(CreateAndSetSmaller("Geozone: " + i.GeoZone));
    }
    
    if (i.IsPrivateProvider)
    {
      addressContainerContainer.appendChild(CreateAndSetSmaller("Private Provider"));
    }
    if (i.IsCommercial)
    {
      addressContainerContainer.appendChild(CreateAndSetSmaller("Commercial"));
    }
    addressColumn.appendChild(addressContainerContainer);
    row.appendChild(addressColumn);

    let inspectorContainer = document.createElement("div");
    inspectorContainer.classList.add("column");
    inspectorContainer.classList.add("medium-2");
    inspectorContainer.classList.add("align-middle");
    inspectorContainer.classList.add("align-center");
    inspectorContainer.classList.add("flex-container");
    inspectorContainer.appendChild(CreateAndSet(i.Inspector));
    row.appendChild(inspectorContainer);

    let secondcolumn = document.createElement("div");
    secondcolumn.classList.add("columns");
    secondcolumn.classList.add("medium-7");
    secondcolumn.classList.add("large-7");
    secondcolumn.classList.add("end");
    for (let insp of i.Inspections)
    {
      let row = document.createElement("div");
      row.classList.add("row");
      row.classList.add("medium-12");
      row.classList.add("large-12");      
      ch.Permit = insp.PermitNumber;
      ch.InspectionId = insp.InspectionId;
      row.appendChild(CreateAndSet(insp.PermitNumber, "columns", "small-4"));
      row.appendChild(CreateLink(insp.InspectionDesc, ch.ToHash(), "medium-6", "columns"));
      row.appendChild(CreateAndSet(insp.ResultADC, "columns", "small-2"));
      let secondRow = document.createElement("div");
      secondRow.classList.add("row");
      secondRow.classList.add("medium-12");
      secondRow.classList.add("large-12");
      secondRow.appendChild(CreateAndSet(CleanComments(insp.Comments)));
      
      secondcolumn.appendChild(row);
      secondcolumn.appendChild(secondRow);
    }    
    row.appendChild(secondcolumn);
    df.appendChild(row);
    return df;
  }

  function CleanComments(comments: string): string
  {
    let c: Array<string> = [];
    let split = comments.trim().split("\r\n");
    for (let s of split)
    {
      if (!MatchBadComments(s))
      {
        c.push(s);
      }
    }
    console.log('split', split);
    return c.join("\r\n");
  }

  function PopulateBadComments()
  {
    // these will need to be lower case.
    InspSched.HideTheseComments = [
      "request created",
      "status changed from"
    ];
  }

  function MatchBadComments(comment: string):boolean
  {
    comment = comment.toLowerCase();
    for (let c of InspSched.HideTheseComments)
    {
      if (comment.indexOf(c) !== -1)
      {
        return true;
      }
    }
    return false;
  }
}