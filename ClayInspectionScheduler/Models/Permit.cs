﻿using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;


namespace ClayInspectionScheduler.Models
{
  public class Permit
  {
    // Had to make public in order to allow me to update the cancel button
    public bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public string ErrorText { get; set; }

    private string ContractorId { get; set; }
    private int Confidential { get; set; }
    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;
    private DateTime WorkersCompExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime LiabilityExpirationDate { get; set; } = DateTime.MaxValue;
    private DateTime PermitIssueDate { get; set; } = DateTime.MaxValue; // check if permt
    private bool HoldStopAll { get; set; } // add check for all stop hold
    private bool HoldStopFinal { get; set; } // check for final stop hold
    //private bool ChargesExist { get; set; } // check for charges
    private bool MasterCoClosed { get; set; } // check if master is Co'd
    private string ContractorStatus { get; set; } // check if Contractor is active


    public List<string> ScheduleDates
    {
      get
      {
        return InspectionDates.GenerateShortDates(IsExternalUser, (ContractorStatus == "A"? DateTime.MinValue : SuspendGraceDate));
      }
    }

    public Permit()
    {

    }

    public static List<Permit> Get(string AssocKey, bool IsExternalUser)
    {
      /**
       * Need to add the following functionality to this
       * query:
       * 
       *    1. check if the permit has been issued (DateTime PermitIssueDate)
       *    2. check if holds exist
       *      a. does hold stop final? (bool HoldStopAll) -- This may be unecessary
       *      b. does hold stop all?  (bool HoldStopFinal)
       *    3. check if there are charges (bool ChargesExist)
       *    4. Is Master Permit Co'd? (bool MasterCoClosed)
       *    
       **/
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo", AssocKey);
      string sql = @"
      USE WATSC;
      DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
      
      SELECT 
        distinct M.PermitNo PermitNo,
        M.PermitNo MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        B.ContractorId,
        M.CoClosed,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus
            
      FROM bpMASTER_PERMIT M
      LEFT OUTER JOIN 
        bpBASE_PERMIT B 
          ON M.BaseID = B.BaseID
      LEFT OUTER JOIN 
        clContractor C 
          ON B.ContractorId = C.ContractorCd 
		
		  WHERE 
        (M.PermitNo = @MPermitNo 
		      OR M.PermitNo = @PermitNo)
		    AND M.VoidDate is NULL

      UNION ALL

      SELECT 
        distinct A.PermitNo PermitNo,
        ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
        B.ProjAddrCombined,
        B.ProjCity,
        CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) SuspendGraceDate,
        B.Confidential,
        A.ContractorId,
        NULL AS CoClosed,
        C.WC_ExpDt WorkersCompExpirationDate,
        C.LiabInsExpDt LiabilityExpirationDate,
        ISNULL(C.Status, '') ContractorStatus
           
      FROM 
        bpASSOC_PERMIT A
      LEFT OUTER JOIN 
        bpBASE_PERMIT B 
          ON A.BaseID = B.BaseID
      LEFT OUTER JOIN 
        clContractor C 
          ON A.ContractorId = C.ContractorCd 

		  WHERE
        (A.PermitNo = @PermitNo 
		        OR MPermitNo = @MPermitNo
		        OR A.mPermitNo = @PermitNo)
   		    AND A.VoidDate IS NULL

    ";
      try
      {
        var permits = Constants.Get_Data<Permit>(sql, dbArgs);
        foreach (Permit l in permits)
        {
          l.IsExternalUser = IsExternalUser;

          if (l.Confidential == 1 && IsExternalUser)
          {
            l.ProjAddrCombined = "Confidential";
            l.ProjCity = "Confidential";
          }

          l.Validate();

        }
        return permits;
      }
      catch (Exception ex)
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
          Check if the Master Permit is CO'd, if yes, then no inspections can be scheduled an any associated permit
          Has a charge associated with it
          Has a hold associated with it that is not ('1SWF', 'PPCC')
          Has a hold that does not hold up the final inspection?
          If the user is external and a final inspection has already been completed
      */
      if (PermitIsNotIssued()) return;

      if (MasterIsCOd()) return;

      if (this.IsExternalUser)
      {
        if (PassedFinal()) return;
      }

      if (ChargesExist()) return;

      if (HoldsExist()) return;

      if (ContractorIssues()) return;
      
    }

    private bool PermitIsNotIssued()
    {
      try
      {
        var dp = new DynamicParameters();
        dp.Add("@PermitNo", this.PermitNo);

        string sql = $@"
        use watsc;
        DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

        SELECT COUNT(*) AS CNT FROM (
        select PermitNo, CAST(IssueDate AS DATE) AS IssueDate from bpASSOC_PERMIT A 
        WHERE IssueDate IS NULL AND PermitNo = @PermitNo
        UNION
        SELECT PermitNo, CAST(IssueDate AS DATE) AS IssueDate FROM bpMASTER_PERMIT M
        WHERE PermitNo = @MPermitNo OR PermitNo = @PermitNo) AS tmp 
        WHERE IssueDate IS NULL AND PERMITNO = @PermitNo

        ";

        var i = Constants.Execute_Scalar<int>(sql, dp);

        switch (i)
        {
          case -1:
            ErrorText = $@"There was an issue checking
                        issue data information 
                        for Permit # {this.PermitNo}";

            return true;
          case 0:
            return false;
          default:
            ErrorText = $@"Permit #{this.PermitNo} has 
                        not yet been issued. Please contact 
                        the building department for assistance";
            return true;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ErrorText = $"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }

    }

    private bool MasterIsCOd()
    {
      try
      {
        var dp = new DynamicParameters();
        dp.Add("@PermitNo", this.PermitNo);

        string sql = $@"
        use watsc;
        DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

        select MPermitNo from
        (
        select distinct PermitNo, MPermitNo from bpASSOC_PERMIT
        where MPermitNo in (
        select PermitNo from bpMASTER_PERMIT
        where (MPermitNo = @PermitNo or MPermitNo = @MPermitNo)
        and CoClosed = 1)
        union 
        select PermitNo, PermitNo as MPermitNo
        from bpMASTER_PERMIT
        where PermitNo in 
	        (select PermitNo 
	        from bpMASTER_PERMIT
	        where (permitno = @PermitNo 
		        or PermitNo = @MPermitNo)
		        and CoClosed = 1)

        union

        select distinct PermitNo, PermitNo as MPermitNo
        from bpINS_REQUEST i
        inner join bpINS_REF ir 
	        on i.InspectionCode = ir.InspCd
        where permitno =
	        (select distinct ISNULL(MPermitNo,PermitNo) MPermitNo 
	        from bpASSOC_PERMIT
	        where permitno = @PermitNo)
        and ir.final = 1
        and LOWER(i.ResultADC) in ('a','p')
        ) as tmp
        order by PermitNo desc
        ";

        var i = Constants.Execute_Scalar<int>(sql, dp);
        switch (i)
        {
          case -1:
            ErrorText = $"There was an issue checking " +
                        $"final inspection information " +
                        $"for Permit #{this.PermitNo}";
            return true;
          case 0:
            return false;
          default:
            ErrorText = $"Permit #{i} has passed the" +
                        $" final inspection, no additional " +
                        $"inspections can be scheduled for this job";
            return true;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ErrorText = $"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }
    }
    
    private bool ChargesExist()
    {
      // returns true if charges exist for this permit or there is an issue getting this data for the permit.
      try
      {
        var dp = new DynamicParameters();
        dp.Add("@PermitNo", this.PermitNo);

        string sql = $@"
          USE WATSC;
          Select 
            COUNT(DISTINCT AssocKey) AS CNT
          FROM ccCashierItem 
          WHERE 
            AssocKey = @PermitNo  -- fix charge check to include looking for contractorId, and permits associated with a contractor ID
            AND Total > 0			    -- CHECKS IF TOTAL (owed) IS GREATER THAN ZERO
            AND CashierId IS NULL	-- CHECK IF CASHIER HAS SIGNED OFF ON CHARGE (IF NULL, THEN CHARGE IS STILL VALID)
            AND UnCollectable = 0
        ";

        int i = Constants.Execute_Scalar<int>(sql, dp);

        switch(i)
        {
          case -1:
            ErrorText = $"There was an issue calculating the charges for Permit #{this.PermitNo}";
            return true;
          case 0:
            return false;
          default:
            ErrorText = $"There is a charge associated with Permit #{this.PermitNo}";
            return true;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ErrorText = $"There was an issue getting data for Permit #{this.PermitNo}";
        return true;
      }

    }

    private bool ContractorIssues()
    {
      // Contractor Owners do not have any valid data for these fields
      if (this.ContractorId.ToUpper() == "OWNER") 
      {
        return false;
      } 
      
      if (this.LiabilityExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Liability Insurance expiration date has passed";
        return true;
      }
      else if (this.WorkersCompExpirationDate <= DateTime.Today)
      {
        ErrorText = "The Contractor's Workman's Compensation Insurance expiration date has passed";
        return true;
      }
      else if (this.ContractorStatus != "A")
      {
        ErrorText = "There is an issue with the contractor's status";
        return true;
      }
      // returns true if contractor issues exist for this permit.
      //"The grace period for this permit has passed."
      return false;
    }

    private bool HoldsExist()
    {
      var dp = new DynamicParameters();
      dp.Add("@PermitNo", this.PermitNo);
      string sql = $@"
        select 
          COUNT(*) AS CNT 
        from bpHOLD h
        where 
          h.PermitNo = @PermitNo
          AND h.HldDate IS NULL
          AND h.Deleted IS NULL
          AND h.HldCd NOT IN ('1SWF','PPCC')
      ";
      // Revisit this when the changes are made to the bpHold_REF table
      // to add hte additional column to check if a hold will prevent
      // the permit from having a final inspection.
      try
      {
        int i = Constants.Execute_Scalar<int>(sql, dp);

        switch (i)
        {
          case -1:
            ErrorText = $"There was an issue checking for holds for Permit #{this.PermitNo}";
            return true;
          case 0:
            return false;
          default:
            ErrorText = $"There is a hold associated with Permit #{this.PermitNo}";
            return true;
        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ErrorText = $"There was an issue checking for holds for Permit #{this.PermitNo}";
        return true;
      }
    }

    private bool PassedFinal()
    {
      var dp = new DynamicParameters();
      dp.Add("@PermitNo", this.PermitNo);
      string sql = $@"
        USE WATSC;

        SELECT 
          COUNT(*) AS CNT 
        FROM bpINS_REQUEST I
        INNER JOIN bpINS_REF IR ON I.InspectionCode = IR.InspCd AND Final = 1
        WHERE 
          PermitNo = @PermitNo
          AND ResultADC IN ('A', 'P')";
      try
      {
        int i = Constants.Execute_Scalar<int>(sql, dp);
        switch (i)
        {
          case -1:
            ErrorText = $"There was an issue checking for a final inspection for Permit #{this.PermitNo}";
            return true;
          case 0:
            return false;
          default:
            ErrorText = $"Permit #{this.PermitNo} has passed a final inspection";
            return true;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ErrorText = $"There was an issue checking for a final inspection for Permit #{this.PermitNo}";
        return true;
      }
    }

  }
}