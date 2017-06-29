﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Net.Http;
using Newtonsoft.Json.Serialization;

namespace ClayInspectionScheduler
{
  public static class WebApiConfig
  {
    public static void Register(HttpConfiguration config)
    {
      // Web API configuration and services

      // Web API routes
      config.MapHttpAttributeRoutes();

      config.Routes.MapHttpRoute(
          name: "DefaultApi",
          routeTemplate: "API/{controller}/{id}/{InspId}/{date}",
          defaults: new { id = RouteParameter.Optional, InspId = RouteParameter.Optional, date = RouteParameter.Optional }
      );
      config.Routes.MapHttpRoute(
        name: "NewInspectionApi",
        routeTemplate: "API/NewInspection/{thisInspection} "
      );
      config.Routes.MapHttpRoute(
        name: "ValidatePermitApi",
        routeTemplate: "API/ValidatePermit/{permitNo}"
      );
    }
  }
}
