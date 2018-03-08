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
        InspSched.IV = ProcessIVInspections(inspections);
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

  function BuildInspectorUI()
  {
    ShowInspectionTab(); // this shows the Inspector View Tab thinger
    // this function will take the 
    // IV data and create the html
    // and add it to the InspectorViewInspections div
    let currentHash = new LocationHash(location.hash.substring(1));
    let target = document.getElementById("InspectorViewInspections");
    let df: DocumentFragment = document.createDocumentFragment();
    UI.clearElement(target);
    if (InspSched.IV.length > 0)
    {
      df.appendChild(BuildHeaderRow());
      for (let i of InspSched.IV)
      {
        df.appendChild(BuildRow(i, currentHash));
      }
    }
    target.appendChild(df);
  }

  function BuildHeaderRow(): DocumentFragment  
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

  function BuildRow(i: InspectionView, ch: LocationHash): DocumentFragment
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

  export function ProcessIVInspections(
    inspections: Array<Inspection>): Array<InspectionView>
  {
    // Let's get our filters.
    let inspector: string = (<HTMLSelectElement>document.getElementById("InspectorList")).value;
    let day: string = (<HTMLInputElement>document.querySelector('input[name="day"]:checked')).value;
    let open: string = (<HTMLInputElement>document.querySelector('input[name="status"]:checked')).value;
    // We're going to filter our results if a day or inspector was passed.
    let isOpen: boolean = open === "Open";
    let ivList: Array<InspectionView> = [];
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
      let iv = new InspectionView(i[0]); // we'll base the inspectorView off of the first inspection returned.
      iv.Inspections = i.map(function (insp)
      {
        return new ShortInspection(insp.InspReqID, insp.InspectionCode + '-' + insp.InsDesc);
      });
      ivList.push(iv);
    }
    return ivList;
  }


}