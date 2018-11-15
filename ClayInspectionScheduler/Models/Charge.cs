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
    public int OTid { get; set; } = -1;
    public string PmtType { get; set; } = "";
    public string PropUseCode { get; set; } = "";



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

      var i = new List<Charge>();

      var PropUseCodes = new List<string>()
      {
        "101","225","700"
      };


      var sql = @"

        USE WATSC;

        WITH PermitsThatNeedDefaultIF_SW_charges (PermitNo, PropUseCode) AS (
        SELECT DISTINCT M.PermitNo, B.PropUseCode
        FROM bpMASTER_PERMIT M
        INNER JOIN bpBASE_PERMIT B ON B.BaseID = M.BaseID
        WHERE M.PermitNo = @PermitNumber)
        ,ChargeItemIds (ItemId, CashierId, AssocKey, OTID, CatCode) AS (
        SELECT DISTINCT
          ITEMID, CashierID, AssocKey, OTId, LTRIM(RTRIM(C.CatCode)) CatCode
          FROM ccCashierItem C
        INNER JOIN ccCatCd CC ON C.CatCode = CC.CatCode
        WHERE UnCollectable = 0
         AND C.AssocKey = @PermitNumber
         AND C.CatCode IN 
            ('IFSF','IFMH','IFMF','IFSCH','IFRD2','IFRD3','RCA','XRCA','CLA','XCLA'))
            
        SELECT 
          DISTINCT C.CashierId, C.Itemid, C.OTid, CP.PmtType, C.CatCode, P.PropUseCode
        FROM ChargeItemIds C
        LEFT OUTER JOIN ccCashierPayment CP ON CP.OTid = C.OTID
        INNER JOIN PermitsThatNeedDefaultIF_SW_charges P ON P.PermitNo = C.AssocKey
        WHERE C.AssocKey = @PermitNumber

      ";

      try
      {
        i.AddRange(Constants.Get_Data<Charge>(sql, dbArgs));

        if (i.Any())
        {

          var listOfImpactFees = (from c in i
                                  where ((c.CatCode == "IFSF" || c.CatCode == "IFMH" || c.CatCode == "IFMF" || c.CatCode == "IFSCH") && c.PmtType == "IFEX")
                                  select c).ToList();


          var paidImpactAndSolidWasteFees = (from c in i
                                             where (c.CashierId != null)
                                             select c).ToList();


          if (!PropUseCodes.Contains(i[0].PropUseCode) || listOfImpactFees.Count() == 1 || paidImpactAndSolidWasteFees.Count() == 4)
          {
            return true;
          }


          Console.Write("TestStop");
        }

        return false;
        //return i != null && i.Count() == 4;
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