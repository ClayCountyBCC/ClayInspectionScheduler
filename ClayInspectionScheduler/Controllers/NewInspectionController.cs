﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  public class NewInspectionController : ApiController
  {

    public IHttpActionResult Save(NewInspection thisInspection)
    {

      if (thisInspection == null)
      {
        return InternalServerError();
      }
      else
      {
        var e = thisInspection.Save(Constants.CheckIsExternalUser(User.Identity.Name));

        return Ok(e);
      }
    }
  }
}
