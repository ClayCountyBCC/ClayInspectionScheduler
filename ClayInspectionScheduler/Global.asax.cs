﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Routing;


namespace ClayInspectionScheduler
{
  public class WebApiApplication :System.Web.HttpApplication
  {
    protected void Application_Start()
    {


      try
      {
        GlobalConfiguration.Configure(WebApiConfig.Register);
        Models.InspType.GetCachedInspectionTypes();
        Models.Inspector.GetCached();
        Models.UserAccess.GetCachedAllUserAccess();
        Models.QuickRemark.GetCachedInspectionQuickRemarks();
      }
      catch(Exception e)
      {
        Console.Write(e);

      }
    }
  }
}
