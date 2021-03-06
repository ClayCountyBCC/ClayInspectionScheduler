﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime;
using System.Runtime.Caching;

namespace ClayInspectionScheduler.Models
{
  public class MyCache
  {
    private static readonly MemoryCache _cache = new MemoryCache("myCache");

    public static object GetItem(string key)
    {
      var CIP = new CacheItemPolicy();
      string[] s = key.Split(new[] { "," }, StringSplitOptions.None);

      switch (s[0].ToLower())
      {
        case "quickremarks":
          CIP.AbsoluteExpiration = DateTime.Now.AddHours(4);
          break;
        case "inspector":
          CIP.AbsoluteExpiration = DateTime.Now.AddHours(4);
          break;
        //case "useraccess":
        //  CIP.AbsoluteExpiration = DateTime.Now.AddDays(1);
        //  break;
        case "inspectiontypes":
          CIP.AbsoluteExpiration = DateTime.Now.AddHours(12);
          break;
        case "datecache":
          CIP.AbsoluteExpiration = DateTime.Now.AddDays(1);
          break;
        default:
          CIP.AbsoluteExpiration = DateTime.Now.AddHours(4);
          break;
      }
      
      return GetOrAddExisting(key, () => InitItem(key), CIP);
    }

    public static object GetItem(string key, CacheItemPolicy CIP)
    {
      return GetOrAddExisting(key, () => InitItem(key), CIP);
    }

    private static T GetOrAddExisting<T>(string key, Func<T> valueFactory, CacheItemPolicy CIP)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, CIP) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch(Exception ex)
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        Constants.Log(ex, "");
        throw;
      }
    }

    private static object InitItem(string key)
    {

      string[] s = key.Split(new[] { "," }, StringSplitOptions.None);

      switch (s[0].ToLower())
      {
        case "quickremarks":
          return QuickRemark.GetInspectionQuickRemarks();
        case "inspector":
          return Inspector.Get();
        //case "useraccess":
        //  return UserAccess.GetAllUserAccess();
        case "inspectiontypes":
          return InspType.Get();
        case "datecache":
          bool IsExternal = bool.Parse(s[1]);
          return new DateCache(IsExternal);
        default:
          return null;
      }
    }
  }
}