namespace InspSched
{
  interface ILocationHash
  {
    Permit: string;
    constructor(locationHash: string);
  }

  export class LocationHash// implements ILocationHash
  {
    public Permit: string = "";


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
        }
      }
      
    }



  }


}