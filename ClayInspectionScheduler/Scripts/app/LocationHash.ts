namespace InspSched
{
  interface ILocationHash
  {
    Permit: string;
    Day: string;
    Inspector: string;
    InspectionId: number;
    constructor(locationHash: string);
  }

  export class LocationHash// implements ILocationHash
  {
    public Permit: string = "";
    public Day: string = ""; // can be Today or Tomorrow
    public Inspector: string = "";  // can be an inspector's name or identifier.
    public InspectionId: number = 0;

    constructor(locationHash: string)
    {
      let ha: Array<string> = locationHash.split("&")
      for (let i = 0; i < ha.length; i++)
      {
        let k: Array<string> = ha[i].split("=");
        switch (k[0].toLowerCase())
        {
          case "permit":
            this.Permit = k[1];
            break;
          case "inspector":
            this.Inspector = k[1];
            break;
          case "day":
            this.Day = k[1];
            break;
          case "inspectionid":
            this.InspectionId = parseInt(k[1]);
            break;
        }
      }

    }

    UpdatePermit(permit: string)
    { // this function is going to take the current LocationHash
      // and using its current properties, going to emit an updated hash
      // with a new EmailId.
      let h: string = "";
      if (permit.length > 0) h += "&permit=" + permit;
      return h.substring(1);
    }

    ToHash(): string
    {
      let h: string = "";
      if (this.Permit.length > 0) h += "&permit=" + this.Permit;
      if (this.Day.length > 0) h += "&day=" + this.Day;
      if (this.Inspector.length > 0) h += "&inspector=" + this.Inspector;
      if (this.InspectionId > 0) h += "&inspectionid=" + this.InspectionId.toString();
      if (h.length > 0) h = "#" + h.substring(1);
      return h;
    }

  }


}