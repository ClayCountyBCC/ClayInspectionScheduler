using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class InspType
  {
    public string InsDesc { get; set; }

    public string InspCd { get; set; }

    public string SubType { get; set; }

    public bool Final { get; set; }

    public bool PreInspection { get; set; }

    public InspType()
    {

    }
    
    public static List<InspType> Get()
    {
      
      var sql = @"
        
        USE WATSC;

        SELECT
          DISTINCT I.InsDesc,
          LTRIM(RTRIM(I.InspCd)) InspCd,
          SubType,
          Final,
          PreInspection
        FROM
          bpINS_REF I
        WHERE
          I.Retired != 1
        ORDER BY 
          I.InsDesc";
      
      var lp = Constants.Get_Data<InspType>(sql);
      return lp;
    }

    public static List<InspType> GetCachedInspectionTypes()
    {
      return (List<InspType>)MyCache.GetItem("inspectiontypes");
    }


  }
}