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

    public string PermitNo { get; set; }
    public string CashierId { get; set; }
    public string CatCode { get; set; }
    public string Description { get; set; }
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
        C.CashierId,
        C.CatCode,
        CC.[Description] Description,
        C.Total 
      FROM ccCashierItem C
      INNER JOIN ccCatCd CC ON C.CatCode = CC.CatCode
      WHERE TOTAL > 0
        AND CashierId IS NULL
        AND UnCollectable = 0
        AND AssocKey = @PermitNumber
      ";

      try
      {

        var charges = Constants.Get_Data<Charge>(sql, dbArgs);

        if (!tryingToScheduleFinal)
        {
          charges.RemoveAll(x => x.CatCode.Trim() == "IFSF" ||
                                 x.CatCode.Trim() == "IFMH" ||
                                 x.CatCode.Trim() == "IFMF" ||
                                 x.CatCode.Trim() == "IFSCH" ||
                                 x.CatCode.Trim() == "IFRD2" ||
                                 x.CatCode.Trim() == "IFRD3" ||
                                 x.CatCode.Trim() == "RCA" ||
                                 x.CatCode.Trim() == "XRCA" || 
                                 x.CatCode.Trim() == "CLA" ||
                                 x.CatCode.Trim() == "XCLA" );
        }

        foreach (var c in charges)
        {
          c.Total = decimal.Round(c.Total, 2, MidpointRounding.AwayFromZero);
        }


        return charges;

      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Charge>();
      }
    }

    public static bool UserCannotScheduleTempPowerEquipmentCheck(string permitNumber)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNumber", permitNumber);

      var sql = @"
        USE WATSC;

        WITH PermitsThatNeedDefaultIF_SW_charges (PermitNo) AS (
        SELECT DISTINCT M.PermitNo
        FROM bpMASTER_PERMIT M
        INNER JOIN bpBASE_PERMIT B ON B.BaseID = M.BaseID
        WHERE PropUseCode IN ('101','225'))
        ,ChargeItemIds (ItemId, AssocKey) AS (
        SELECT DISTINCT
          ITEMID, AssocKey
          FROM ccCashierItem C
        INNER JOIN ccCatCd CC ON C.CatCode = CC.CatCode
        WHERE TOTAL > 0
          AND CashierId IS NULL
          AND UnCollectable = 0
          AND C.AssocKey = @PermitNumber
          AND C.CatCode IN 
            ('IFSF','IFMH','IFMF','IFSCH','IFRD2','IFRD3','RCA','XRCA','CLA','XCLA'))

        SELECT 
          DISTINCT Itemid
        FROM ChargeItemIds C
        INNER JOIN PermitsThatNeedDefaultIF_SW_charges P ON P.PermitNo = C.AssocKey
        WHERE C.AssocKey = @PermitNumber

      ";

      try
      {
        var i = Constants.Get_Data<string>(sql, dbArgs);
        
        return i != null && i.Count() !=  0;
      }

      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return false;
      }
    }

    // TODO: find more information on implementing this. 
    // this would determine if an impact fee should exist on this permit. (does not currently do that, only returns a list of itemIds) 

    //public static bool PermitShouldHaveSolidWasteFees(string permitNumber)
    //{
    //  var dbArgs = new DynamicParameters();
    //  dbArgs.Add("@PermitNumber", permitNumber);

    //  var sql = @"
    //    USE WATSC;

    //    WITH PermitsThatNeedDefaultIF_SW_charges (PermitNo) AS (
    //    SELECT DISTINCT M.PermitNo
    //    FROM bpMASTER_PERMIT M
    //    INNER JOIN bpBASE_PERMIT B ON B.BaseID = M.BaseID
    //    WHERE PropUseCode IN ('101','225'))
    //    ,ChargeItemIds (ItemId, AssocKey) AS (
    //    SELECT DISTINCT
    //      ITEMID, AssocKey
    //      FROM ccCashierItem C
    //    INNER JOIN ccCatCd CC ON C.CatCode = CC.CatCode
    //    WHERE TOTAL > 0
    //      AND CashierId IS NULL
    //      AND UnCollectable = 0
    //      AND C.AssocKey = @PermitNumber
    //      AND C.CatCode IN 
    //        ('IFSF','IFMH','IFMF','IFSCH','IFRD2','IFRD3','RCA','XRCA','CLA','XCLA'))

    //    SELECT 
    //      DISTINCT Itemid
    //    FROM ChargeItemIds C
    //    INNER JOIN PermitsThatNeedDefaultIF_SW_charges P ON P.PermitNo = C.AssocKey
    //    WHERE C.AssocKey = @PermitNumber

    //  ";

    //  try
    //  {
    //    var i = Constants.Get_Data<string>(sql, dbArgs);

    //    return i == null || i.Count() == 0;
    //  }
    //  catch (Exception ex)
    //  {
    //    Constants.Log(ex, sql);
    //    return false;
    //  }
     
    //}
  }
}