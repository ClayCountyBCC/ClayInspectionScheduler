﻿using System;
using System.Collections.Generic;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Permit
  {
    static bool PermitCheck { get; set; }

    // Had to make public in order to allow me to update the cancel button
    public bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public int Confidential { get; set; }
    public string ErrorText { get; set; }

    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;
    private DateTime WorkersCompExpirationDate { get; set; }
    private DateTime LiabilityExpirationDate { get; set; }
    private string ContractorStatus { get; set; }

    public List<string> ScheduleDates
    {
      get
      {
        return InspectionDates.GenerateShortDates(IsExternalUser,SuspendGraceDate);
      }
    }

    public Permit()
    {

    }

    public static List<Permit> Get(string AssocKey,bool IsExternalUser)
    {

      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo",AssocKey);

      string sql = @"
      USE WATSC;
      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
      SELECT DISTINCT 
        A.PermitNo PermitNo,
        ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        C.Status ContractorStatus
      FROM bpASSOC_PERMIT A
      LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON A.ContractorId = C.ContractorCd
      WHERE 
        (A.PermitNo = @PermitNo OR MPermitNo = @MPermitNo)
        AND A.VoidDate IS NULL

      UNION ALL

      SELECT 
        M.PermitNo PermitNo,
        M.PermitNo MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        C.Status ContractorStatus
      FROM bpMASTER_PERMIT M    
      LEFT OUTER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
      LEFT OUTER JOIN clContractor C ON B.ContractorId = C.ContractorCd
      WHERE 
        (M.PermitNo = @PermitNo OR M.PermitNo = @MPermitNo)
        AND M.VoidDate IS NULL
    ";
      try
      {
        var lp = Constants.Get_Data<Permit>(sql,dbArgs);
        foreach(Permit l in lp)
        {
          l.IsExternalUser=IsExternalUser;

          if(l.Confidential==1&&IsExternalUser)
          {
            l.ProjAddrCombined="Confidential";
            l.ProjCity="Confidential";
          }

          l.Validate();

        }
        return lp;
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        return null;
      }


    }

    public void Validate()
    {
      /*
      They cannot schedule an inspection if:
        the Contractor associated with permit --
          Anything other than A in the Status field in clContractor (S is Suspended)
          Worker's comp date is past
          Liability insurance date is past
          SuspendGraceDt + 15 days is past

        the Permit --
          Has a charge associated with it
          Has a hold associated with it that is not ('1SWF', 'PPCC')
          Has a hold that does not hold up the final inspection?
          If the user is external and a final inspection has already been completed
      */
      if(ChargesExist()) return;

      if(ContractorIssues()) return;

      if(HoldsExist()) return;
      
      if(this.IsExternalUser)
      {
        if(PassedFinal()) return;
      }
    }

    private bool ChargesExist()
    {

      // returns true if charges exist for this permit or there is an issue getting this data for the permit.
      try
      {
      string sql = $@"
        USE WATSC;
        Select distinct AssocKey from ccCashierItem 
        where AssocKey = {this.PermitNo}
        AND Total > 0			    -- CHECKS IF TOTAL (owed) IS GREATER THAN ZERO
        AND CashierId IS NULL	-- CHECK IF CASHIER HAS SIGNED OFF ON CHARGE (IF NULL, THEN CHARGE IS STILL VALID)
        AND UnCollectable = 0
        ";

        var lp = Constants.Get_Data<Permit>(sql);

        if(lp.Count>0)
        {
          ErrorText=$"There is a charge associated with Permit #{this.PermitNo}";
          return true;
        }
        else
          return false;
        
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        ErrorText=$"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }

    }

    private bool ContractorIssues()
    {
     
      if(this.LiabilityExpirationDate<=DateTime.Today)
      {
        ErrorText="The Contractor's Liability Insurance expiration date has passed";
        return true;
      }
      else if(this.WorkersCompExpirationDate<=DateTime.Today)
      {
        ErrorText="The Contractor's Workman's Compensation Insurance expiration date has passed";
        return true;
      }
      else if(this.ContractorStatus!="A")
      {
        ErrorText="There is an issue with the contractor's status";
        return true;
      }
      else if(this.SuspendGraceDate<DateTime.Today && this.SuspendGraceDate != DateTime.MinValue)
      {
        ErrorText="The Grace Period for this permit has passed";
        return true;
      }
      // returns true if contractor issues exist for this permit.
      //"The grace period for this permit has passed."
      return false;
    }

    private bool HoldsExist()
    {
      //bool holdsExist = false;
      string sql = $@"
      select * from bpHOLD h
      where h.PermitNo = {this.PermitNo}
      AND HldDate IS NULL
      --AND H.HldCd NOT IN ('1SWF','PPCC')
      ";

      try
      {
        var lp = Constants.Get_Data<Permit>(sql);
        if(lp.Count>0)
        {
          ErrorText=($"There is a hold associated with Permit #{PermitNo}");
          return true;
        }
        else
          return false;
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        ErrorText=$"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }
    }

    private bool PassedFinal()
    {
      
      string sql = $@"
        
        USE WATSC;
        DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = {this.PermitNo});

        SELECT PERMITNO FROM bpINS_REQUEST I
        JOIN bpINS_REF IR ON I.InspectionCode = IR.InspCd
        WHERE PermitNo = {this.PermitNo}
	        AND I.InspectionCode IN (SELECT InspCd FROM bpINS_REF WHERE Partial = 0) 
          AND ResultADC IN ('A', 'P')";
      try
      {
        var lp = Constants.Get_Data<Permit>(sql);
        if(lp.Count>0)
        {
          ErrorText=($"Permit #{this.PermitNo} has passed a final inspection");
          return true;
        }
        else
          return false;
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        ErrorText=$"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }
    }

    
  }
}