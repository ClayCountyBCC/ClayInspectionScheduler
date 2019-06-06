using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Caching;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Inspector
  {
    public int Id { get; set; } = -1;
    public string Name { get; set; } = "";
    public string Color { get; set; } = "";
    public bool CommercialPermit { get; set; } = false;
    public bool BuildingPermit { get; set; } = false;
    public bool ElectricalPermit { get; set; } = false;
    public bool MechanicalPermit { get; set; } = false;
    public bool PlumbingPermit { get; set; } = false;
    public bool PrivateProvider { get; set; } = false;
    public bool ResidentialPermit { get; set; } = false;
    public string Initials { get; set; } = "";
    public bool InDevelopment { get; set; } = true;
    public string AppAddressStart { get; set; } = "";
    public string NTUsername { get; set; } = "";

    public Inspector()
    {

    }

    public static List<Inspector> Get()
    {

      string query = $@"
        SELECT 
          ID,
          LTRIM(RTRIM(Name)) Name,
          ISNULL(Color, '#FFFFFF') Color,
          Comm CommercialPermit,
          BL BuildingPermit,
          EL ElectricalPermit,
          ME MechanicalPermit,
          PL PlumbingPermit,  
          Residential ResidentialPermit,
          PrivateProvider,
          Intl Initials,
          {(Constants.UseProduction() == false ? 1 : 0).ToString()} InDevelopment,
          LOWER(NTUsername) NTUserName
        FROM bp_INSPECTORS
        WHERE 
          Active=1
        ORDER BY Name ASC;";

      try
      {
        var inspectors = Constants.Get_Data<Inspector>(query);
        string host = Constants.UseProduction() ? "claybccims" : "claybccimstrn";

        foreach (var i in inspectors)
        {
          i.AppAddressStart = $@"http://{host}/WATSWeb/Permit/";
        }

        return inspectors;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return new List<Inspector>();
      }

    }
    public static List<Inspector> GetCached()
    {
      var CIP = new CacheItemPolicy() { AbsoluteExpiration = DateTime.Today.AddDays(1) };
      return (List<Inspector>)MyCache.GetItem("inspector", CIP);
    }

  }
}