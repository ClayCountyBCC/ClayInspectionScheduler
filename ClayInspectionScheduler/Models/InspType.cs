﻿using System;
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

    public bool Final { get; set; }

    // fee on fail


    public static List<InspType> Get(bool IsExternalUser)
    {
      
      string sql = @"
        
        USE WATSC;

        SELECT
          DISTINCT I.InsDesc,
          LTRIM(RTRIM(I.InspCd)) InspCd,
          Final
        FROM
                bpINS_REF I
        WHERE
                I.Retired != 1
        ORDER BY 
          I.InsDesc
        ";
      
      var lp = Constants.Get_Data<InspType>(sql);



      return lp;
    }



  }
}