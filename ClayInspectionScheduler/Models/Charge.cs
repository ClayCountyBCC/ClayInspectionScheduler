using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;
using System.Collections;

namespace ClayInspectionScheduler.Models
{

  
  public class Charge
  {

    public string PermitNo{ get; set; }
    public string CashierId { get; set; }
    public string CatCode { get; set; }
    public string Description{ get;set; }
    public decimal Total { get; set; }
    

    public Charge()
    { 
    
    
    }

    public static List<Charge> GetCharges(string PermitNumber, bool tryingToScheduleFinal = false)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNumber", PermitNumber);

      var sql = @"
      USE WATSC; 

      SELECT
        -- RTRIM(LTRIM(C.AssocKey)) PermitNo,
        RTRIM(LTRIM(C.CashierId)),
        RTRIM(LTRIM(C.CatCode)),
        CC.[Description] Description,
        C.Total 
      FROM ccCashierItem C
      INNER JOIN ccCatCd CC ON RTRIM(LTRIM(C.CatCode)) = RTRIM(LTRIM(CC.CatCode))
      WHERE TOTAL > 0
        AND CashierId IS NULL
        AND UnCollectable = 0
        AND AssocKey = @PermitNumber
      ";
      
      try{

        var charges = Constants.Get_Data<Charge>(sql, dbArgs);

        if(!tryingToScheduleFinal)
        {
          charges.RemoveAll(x => x.CatCode == "IFSF" || 
                                 x.CatCode == "IFMH" || 
                                 x.CatCode == "IFMF" || 
                                 x.CatCode == "IFSCH" || 
                                 x.CatCode == "IFRD2" || 
                                 x.CatCode == "IFRD3");
        }

        foreach(var c in charges)
        {
          c.Total = decimal.Round(c.Total, 2, MidpointRounding.AwayFromZero);
        }


        return charges;
        
      }catch(Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Charge>();
      }
    }
  }
}