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
    public string CashierId { get; set; } = "";
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
        LTRIM(RTRIM(C.CatCode)) CatCode,
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
          charges.RemoveAll(x => x.CatCode.Trim() == "RCA" ||
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

    public static bool UserCannotScheduleTempPowerEquipmentCheck(string permit_number, string propUseCode, DateTime createdDate)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@permit_number", permit_number);

      var i = new List<Charge>();

      var PropUseCodes = new List<string>()
      {
        "101","225","101M","102","103","104","105","106"
      };

      if (!PropUseCodes.Contains(propUseCode)) return true;

      var sql = @"

        USE WATSC;

        WITH otids AS (
          SELECT DISTINCT OTID FROM ccCashierItem
          WHERE AssocKey = @permit_number
            AND CashierId IS NOT NULL
            AND CatCode IN ('IFSF','IFMH','IFMF','IFSCH','IFRD2','IFRD3')
        )

        SELECT 
          CI.CashierID, 
          CC.CatCode, 
          CI.Total
        FROM ccCashierItem CI
        LEFT OUTER JOIN ccCatCd CC ON CC.CATCODE = CI.CatCode
        WHERE AssocKey = @permit_number
          AND CI.CatCode LIKE 'IF%'
        UNION
        SELECT 
          'total' cashier_id,
          'payment_total' category_code,
          SUM(AmtApplied) total
        FROM ccCashierPayment CP
        INNER JOIN otids O ON O.OTId = CP.OTid
        UNION ALL
        SELECT 
          'total' cashier_id,
          'non_impact_fee_total' category_code,
          SUM(TOTAL) total
        FROM ccCashierItem CI
        INNER JOIN otids O ON O.OTId = CI.OTId
         AND CatCode NOT IN ('IFSF','IFMH','IFMF','IFSCH','IFRD2','IFRD3')


      ";

      try
      {
        i.AddRange(Constants.Get_Data<Charge>(sql, dbArgs));

        if (i.Any())
        {
          /*
           * Road Impact Fees became effective 01-01-2018
           * However, the new ClayPay process began approx 09-01-2018 
           * allowing for impact fee credits.
           * 
           * These dates, along with the number of paid impact fees on the 
           * record will determine whether an Equipment check/temp power 
           * inspection can be scheduled. The rules are as follows:
           *  1. The PropUseCode for the permit must be in the following:
           *    a. "101","225","101M","102","103","104","105","106"
           *    b. This is not a definitive list. The list may be updated
           *       periodically in order to stay within statutes or official
           *       guidelines
           *  2. If the permit was created between 1-1-2018 and 8-31-2018
           *    a. there can be 1 or 2 impact fees on the permit. 
           *       This is due to the previous process of deleting the charge 
           *       if it was credited or waived
           *    b. The new ClayPay process assigns an OTID and CashierId to
           *       a credited or waived impact fee, allowing the record to 
           *       remain on the permit and be considered handled (paid, credited, waived)
           *  3. If the permit was created before 1-1-2018
           *    a. There will be only 1 impact fee on the permit
           *       The School impact fee was the only fee assessed prior to the 1-1-2018 date.
           *  4. If the permit was created on or after 9-1-2018
           *    a. The permit will have 2 impact fees
           *    
           *  IF NUMBER 1 IS NOT TRUE, ALLOW THE INSPECTION
           *  IF ANY OF 2,3, OR 4 IS TRUE, ALLOW THE INSPECTION
           *  
           *  THESE RULES ARE SUBJECT TO CHANGE AND WILL BE UPDATED PERIODICALLY TO 
           *  REFLECT THOSE CHANGES
          */
          if (i.Any(c => c.CashierId == "") == true) return false;

          var minRoadImpactFeeDate = new DateTime(2018, 1, 1).Date;

          List<Charge> listOfImpactFees = new List<Charge>();
          listOfImpactFees.AddRange(from c in i
                                    where 
                                      c.CatCode == "IFSF" ||
                                      c.CatCode == "IFMH" ||
                                      c.CatCode == "IFMF" ||
                                      c.CatCode == "IFSCH" ||
                                      c.CatCode == "IFRD2" ||
                                      c.CatCode == "IFRD3"
                                    select c);


          var payment_total = (from j in i
                              where j.CatCode == "payment_total"
                              select j.Total).Sum();

          var total_paid = (from j in i
                            where j.CatCode == "non_impact_fee_total"
                            select j.Total).Sum();

          if (

                 (createdDate.Date >= minRoadImpactFeeDate.Date &&
                  listOfImpactFees.Count == 2 &&
                  payment_total - total_paid != listOfImpactFees.Sum(x => x.Total)) ||

                 (createdDate.Date < minRoadImpactFeeDate.Date &&
                      listOfImpactFees.Count() == 1)
              )
          {
            return true;
          }

        }

        return false;
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