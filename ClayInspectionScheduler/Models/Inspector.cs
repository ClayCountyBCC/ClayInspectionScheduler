using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayInspectionScheduler.Models
{
  public class Inspector
  {
    public string Name { get; set; }
    public string Color { get; set; }
    public bool CommercialPermit { get; set; }
    public bool BuildingPermit { get; set; }
    public bool ElectricalPermit { get; set; }
    public bool MechanicalPermit { get; set; }
    public bool PlumbingPermit { get; set; }
    public bool PrivateProvider { get; set; }
    public string Initials { get; set; }

    public Inspector()
    {

    }

    public static List<Inspector> Get()
    {
      string query = @"
        SELECT 
          LTRIM(RTRIM(Name)) Name,
          ISNULL(Color, '#FFFFFF') Color,
          Comm CommercialPermit,
          BL BuildingPermit,
          EL ElectricalPermit,
          ME MechanicalPermit,
          PL PlumbingPermit,  
          PrivateProvider,
          Intl Initials
        FROM bp_INSPECTORS
        WHERE 
          Active=1
        ORDER BY Name ASC;";
      return Constants.Get_Data<Inspector>(query);
    }

    public static List<Inspector> GetCached()
    {
      return (List<Inspector>)MyCache.GetItem("inspector");
    }

  }
}