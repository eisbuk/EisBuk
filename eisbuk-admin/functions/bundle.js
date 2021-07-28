!(function () {
  "use strict";
  var i = {
      783: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.aggregateBookings = a.aggregateSlots = a.addMissingSecretKey = void 0);
        const s = r(o(576)),
          c = l(o(54)),
          d = o(231),
          u = o(223),
          m = o(147),
          f = d.v4;
        (a.addMissingSecretKey = s
          .region("europe-west6")
          .firestore.document(
            "organizations/{organization}/customers/{customerId}"
          )
          .onWrite((i, a) =>
            t(void 0, void 0, void 0, function* () {
              const o = c.default.firestore(),
                { organization: e, customerId: n } = a.params,
                r = i.after.data();
              if (r) {
                const a = r.secret_key || f(),
                  t = Object.assign(
                    Object.assign(
                      Object.assign(
                        { customer_id: n },
                        r.name && { name: r.name }
                      ),
                      r.surname && { surname: r.surname }
                    ),
                    r.category && { category: r.category }
                  );
                return (
                  yield o
                    .collection("organizations")
                    .doc(e)
                    .collection("bookings")
                    .doc(a)
                    .set(t),
                  r.secret_key ? null : i.after.ref.update({ secret_key: a })
                );
              }
              return i.after;
            })
          )),
          (a.aggregateSlots = s
            .region("europe-west6")
            .firestore.document("organizations/{organization}/slots/{slotId}")
            .onWrite((i, a) =>
              t(void 0, void 0, void 0, function* () {
                const o = c.default.firestore(),
                  { organization: e, slotId: n } = a.params;
                let r, t;
                const l = i.after.data();
                l
                  ? ((t = Object.assign(Object.assign({}, l), { id: n })),
                    (r = u.DateTime.fromJSDate(new Date(1e3 * t.date.seconds))))
                  : ((r = u.DateTime.fromJSDate(
                      new Date(1e3 * i.before.data().date.seconds)
                    )),
                    (t = c.default.firestore.FieldValue.delete()));
                const s = r.toISO().substring(0, 7),
                  d = r.toISO().substring(0, 10);
                return (
                  yield o
                    .collection("organizations")
                    .doc(e)
                    .collection("slotsByDay")
                    .doc(s)
                    .set({ [d]: { [n]: t } }, { merge: !0 }),
                  i.after
                );
              })
            )),
          (a.aggregateBookings = s
            .region("europe-west6")
            .firestore.document(
              "organizations/{organization}/bookings/{secretKey}/data/{bookingId}"
            )
            .onWrite((i, a) =>
              t(void 0, void 0, void 0, function* () {
                const o = c.default.firestore(),
                  { organization: e, secretKey: n } = a.params,
                  r = (yield o
                    .collection("organizations")
                    .doc(e)
                    .collection("bookings")
                    .doc(n)
                    .get()).data().customer_id,
                  t = i.after.exists,
                  l = t ? i.after.data() : i.before.data(),
                  d = m.fs2luxon(l.date).toISO().substring(0, 7),
                  u = t ? l.duration : c.default.firestore.FieldValue.delete();
                return (
                  i.after.exists || s.logger.log("deleting"),
                  o
                    .collection("organizations")
                    .doc(e)
                    .collection("bookingsByDay")
                    .doc(d)
                    .set({ [l.id]: { [r]: u } }, { merge: !0 })
                );
              })
            ));
      },
      341: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__exportStar) ||
            function (i, a) {
              for (var o in i)
                "default" === o ||
                  Object.prototype.hasOwnProperty.call(a, o) ||
                  e(a, i, o);
            },
          r =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          r(o(54)).default.initializeApp(),
          n(o(783), a),
          n(o(837), a),
          n(o(707), a),
          n(o(252), a),
          n(o(524), a);
      },
      837: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.migrateSlotsToPluralCategories = void 0);
        const s = r(o(576)),
          c = l(o(54)),
          d = l(o(804)),
          u = o(147);
        a.migrateSlotsToPluralCategories = s
          .region("europe-west6")
          .https.onCall(({ organization: i }, a) =>
            t(void 0, void 0, void 0, function* () {
              yield u.checkUser(i, a.auth);
              const o = c.default
                  .firestore()
                  .collection("organizations")
                  .doc(i),
                e = yield o.collection("slots").get(),
                n = [];
              e.forEach((i) => {
                const a = i.data(),
                  { category: e } = a;
                if (e) {
                  const r = Object.assign(
                    Object.assign({}, d.default.omit(a, "category")),
                    { categories: [e] }
                  );
                  n.push(o.collection("slots").doc(i.id).set(r));
                }
              }),
                s.logger.info(`Updating ${n.length} records`),
                yield Promise.all(n),
                s.logger.info(`Finished: ${n.length} records updated`);
            })
          );
      },
      707: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.amIAdmin = void 0);
        const s = r(o(576)),
          c = l(o(54));
        a.amIAdmin = s
          .region("europe-west6")
          .https.onCall(({ organization: i }, { auth: a }) =>
            t(void 0, void 0, void 0, function* () {
              if (!a) return { amIAdmin: !1 };
              const o = (yield c.default
                .firestore()
                .collection("organizations")
                .doc(i)
                .get()).data();
              return {
                amIAdmin:
                  o &&
                  o.admins &&
                  (o.admins.includes(a.token.email) ||
                    o.admins.includes(a.token.phone_number)),
              };
            })
          );
      },
      252: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.createOrganization = a.ping = a.createTestData = void 0);
        const s = r(o(576)),
          c = l(o(54)),
          d = o(223),
          u = l(o(804)),
          m = o(231),
          f = o(711),
          g = o(147),
          b = r(o(531)),
          p = r(o(195)),
          A = m.v4;
        (a.createTestData = s
          .region("europe-west6")
          .https.onCall(({ numUsers: i = 1, organization: a }, o) =>
            t(void 0, void 0, void 0, function* () {
              return (
                yield g.checkUser(a, o.auth),
                s.logger.info(`Creating ${i} test users`),
                s.logger.error(`Creating ${i} test users`),
                yield v(i, a),
                { success: !0 }
              );
            })
          )),
          (a.ping = s
            .region("europe-west6")
            .https.onCall(
              (i) => (
                s.logger.info("ping invoked"),
                { pong: !0, data: Object.assign({}, i) }
              )
            )),
          (a.createOrganization = s
            .region("europe-west6")
            .https.onCall(({ organization: i }) =>
              c.default
                .firestore()
                .collection("organizations")
                .doc(i)
                .set({ admins: ["test@eisbuk.it", "+39123"] })
            ));
        const v = (i, a) =>
            t(void 0, void 0, void 0, function* () {
              const o = c.default
                .firestore()
                .collection("organizations")
                .doc(a);
              u.default.range(i).map(() =>
                t(void 0, void 0, void 0, function* () {
                  const i = u.default.sample(b),
                    a = u.default.sample(p),
                    e = {
                      id: A(),
                      birthday: "2000-01-01",
                      name: i,
                      surname: a,
                      email: C(`${i}.${a}@example.com`.toLowerCase()),
                      phone: "12345",
                      category: u.default.sample(Object.values(f.Category)),
                      certificateExpiration: d.DateTime.local()
                        .plus({ days: u.default.random(-40, 200) })
                        .toISODate(),
                    };
                  yield o.collection("customers").doc(e.id).set(e);
                })
              );
            }),
          C = (i) => u.default.deburr(i.replace(/ /i, "."));
      },
      524: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.createTestSlots = void 0);
        const s = r(o(576)),
          c = l(o(54)),
          d = l(o(804)),
          u = o(711),
          m = o(147),
          f = Object.values(u.Category),
          g = ["", "Pista 1", "Pista 2"],
          b = Object.values(u.SlotType),
          p = (i, a) =>
            t(void 0, void 0, void 0, function* () {
              const o = new c.default.firestore.Timestamp(i, 0),
                e = new c.default.firestore.Timestamp(i + 86400, 0),
                n = c.default.firestore().collection("organizations").doc(a),
                r = yield n
                  .collection("slots")
                  .where("date", ">=", o)
                  .where("date", "<=", e)
                  .get(),
                t = [];
              r.forEach((i) => {
                t.push(i.ref.delete());
              }),
                yield Promise.all(t);
              const l = n.collection("slots"),
                s = c.default.firestore.Timestamp,
                u = [
                  l.add({
                    date: new s(i + 32400, 0),
                    type: d.default.sample(b),
                    durations: ["60"],
                    categories: d.default.sampleSize(
                      f,
                      d.default.random(f.length - 1) + 1
                    ),
                    notes: d.default.sample(g),
                  }),
                  l.add({
                    date: new s(i + 36e3, 0),
                    type: d.default.sample(b),
                    durations: ["60"],
                    categories: d.default.sampleSize(
                      f,
                      d.default.random(f.length - 1) + 1
                    ),
                    notes: d.default.sample(g),
                  }),
                  l.add({
                    date: new s(i + 54e3, 0),
                    type: d.default.sample(b),
                    durations: ["60", "90", "120"],
                    categories: d.default.sampleSize(
                      f,
                      d.default.random(f.length - 1) + 1
                    ),
                    notes: d.default.sample(g),
                  }),
                  l.add({
                    date: new s(i + 63e3, 0),
                    type: d.default.sample(b),
                    durations: ["60", "90", "120"],
                    categories: d.default.sampleSize(
                      f,
                      d.default.random(f.length - 1) + 1
                    ),
                    notes: d.default.sample(g),
                  }),
                ];
              yield Promise.all(u);
            });
        a.createTestSlots = s
          .region("europe-west6")
          .https.onCall(({ organization: i }, a) =>
            t(void 0, void 0, void 0, function* () {
              yield m.checkUser(i, a.auth),
                s.logger.info("Creating test slots...");
              const o = m.roundTo(
                  c.default.firestore.Timestamp.now().seconds,
                  86400
                ),
                e = [];
              for (let a = -14; a < 15; a++) {
                const n = o + 86400 * a;
                e.push(p(n, i));
              }
              return yield Promise.all(e), "Test slots created";
            })
          );
      },
      147: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (i, a) {
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: a,
                  });
                }
              : function (i, a) {
                  i.default = a;
                }),
          r =
            (this && this.__importStar) ||
            function (i) {
              if (i && i.__esModule) return i;
              var a = {};
              if (null != i)
                for (var o in i)
                  "default" !== o &&
                    Object.prototype.hasOwnProperty.call(i, o) &&
                    e(a, i, o);
              return n(a, i), a;
            },
          t =
            (this && this.__awaiter) ||
            function (i, a, o, e) {
              return new (o || (o = Promise))(function (n, r) {
                function t(i) {
                  try {
                    s(e.next(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function l(i) {
                  try {
                    s(e.throw(i));
                  } catch (i) {
                    r(i);
                  }
                }
                function s(i) {
                  var a;
                  i.done
                    ? n(i.value)
                    : ((a = i.value),
                      a instanceof o
                        ? a
                        : new o(function (i) {
                            i(a);
                          })).then(t, l);
                }
                s((e = e.apply(i, a || [])).next());
              });
            },
          l =
            (this && this.__importDefault) ||
            function (i) {
              return i && i.__esModule ? i : { default: i };
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.fs2luxon = a.checkUser = a.roundTo = void 0);
        const s = r(o(576)),
          c = l(o(54)),
          d = o(223);
        (a.roundTo = (i, a) => Math.floor(i / a) * a),
          (a.checkUser = (i, a) =>
            t(void 0, void 0, void 0, function* () {
              var o;
              if (a && a.token && (a.token.email || a.token.phone_number)) {
                const e = yield c.default
                  .firestore()
                  .collection("organizations")
                  .doc(i)
                  .get();
                u(
                  null === (o = e.data()) || void 0 === o ? void 0 : o.admins,
                  a
                ) || m();
              } else m();
            }));
        const u = (i, a) => {
            if (!Array.isArray(i) || !(null == a ? void 0 : a.token)) return !1;
            const { email: o, phone_number: e } = a.token;
            return !!((o && i.includes(o)) || (e && i.includes(e)));
          },
          m = () => {
            throw new s.https.HttpsError(
              "permission-denied",
              "unauthorized",
              "The function must be called while authenticated with a user that is an admin of the given organization."
            );
          };
        a.fs2luxon = (i) => d.DateTime.fromMillis(1e3 * i.seconds);
      },
      531: function (i) {
        i.exports = JSON.parse(
          '["Bacco","Baldassarre","Balderico","Baldo","Baldomero","Baldovino","Barbarigo","Bardo","Bardomiano","Barnaba","Barsaba","Barsimeo","Bartolo","Bartolomeo","Basileo","Basilio","Bassiano","Bastiano","Battista","Beato","Bellino","Beltramo","Benedetto","Beniamino","Benigno","Benito","Benvenuto","Berardo","Berengario","Bernardo","Beronico","Bertoldo","Bertolfo","Biagio","Bibiano","Bindo","Bino","Birino","Bonagiunta","Bonaldo","Bonaventura","Bonavita","Bonifacio","Bonito","Boris","Bortolo","Brancaleone","Brando","Bruno","Bruto","Babila","Bambina","Barbara","Bartolomea","Basilia","Bassilla","Batilda","Beata","Beatrice","Belina","Benedetta","Beniamina","Benigna","Benvenuta","Berenice","Bernadetta","Betta","Bianca","Bibiana","Bice","Brigida","Brigitta","Bruna","Brunilde","Caino","Caio","Calanico","Calcedonio","Callisto","Calogero","Camillo","Candido","Cantidio","Canziano","Carlo","Carmelo","Carmine","Caronte","Carponio","Casimiro","Cassiano","Cassio","Casto","Cataldo","Catullo","Cecco","Cecilio","Celso","Cesare","Cesario","Cherubino","Chiaffredo","Cino","Cipriano","Cirano","Ciriaco","Cirillo","Cirino","Ciro","Clarenzio","Claudio","Cleandro","Clemente","Cleonico","Climaco","Clinio","Clodomiro","Clodoveo","Colmanno","Colmazio","Colombano","Colombo","Concetto","Concordio","Corbiniano","Coreno","Coriolano","Cornelio","Coronato","Corrado","Cosimo","Cosma","Costante","Costantino","Costanzo","Cremenzio","Crescente","Crescenzio","Crespignano","Crispino","Cristaldo","Cristiano","Cristoforo","Crocefisso","Cuniberto","Cupido","Calogera","Calpurnia","Camelia","Camilla","Candida","Capitolina","Carina","Carla","Carlotta","Carmela","Carmen","Carola","Carolina","Casilda","Casimira","Cassandra","Cassiopea","Catena","Caterina","Cecilia","Celeste","Celinia","Chiara","Cinzia","Cirilla","Clara","Claudia","Clelia","Clemenzia","Cleo","Cleofe","Cleopatra","Cloe","Clorinda","Cointa","Colomba","Concetta","Consolata","Cora","Cordelia","Corinna","Cornelia","Cosima","Costanza","Crescenzia","Cristiana","Cristina","Crocefissa","Cronida","Cunegonda","Cuzia"," ","Daciano","Dacio","Dagoberto","Dalmazio","Damaso","Damiano","Damocle","Daniele","Danilo","Danio","Dante","Dario","Davide","Davino","Decimo","Delfino","Demetrio","Democrito","Demostene","Deodato","Desiderato","Desiderio","Didimo","Diego","Dino","Diocleziano","Diodoro","Diogene","Diomede","Dione","Dionigi","Dionisio","Divo","Dodato","Domenico","Domezio","Domiziano","Donatello","Donato","Doriano","Doroteo","Duccio","Duilio","Durante","Dafne","Dalida","Dalila","Damiana","Daniela","Daria","Deanna","Debora","Degna","Delfina","Delia","Delinda","Delizia","Demetria","Deodata","Desdemona","Desiderata","Devota","Diamante","Diana","Dianora","Diletta","Dina","Diodata","Dionisia","Doda","Dolores","Domenica","Donata","Donatella","Donna","Dora","Dorotea","Druina","Dulina","Eberardo","Ecclesio","Edgardo","Edilberto","Edmondo","Edoardo","Efisio","Efrem","Egeo","Egidio","Eginardo","Egisto","Eleuterio","Elia","Eliano","Elifio","Eligio","Elio","Eliodoro","Eliseo","Elita","Elmo","Elogio","Elpidio","Elvezio","Elvino","Emanuele","Emidio","Emiliano","Emilio","Emmerico","Empirio","Endrigo","Enea","Enecone","Ennio","Enrico","Enzo","Eraclide","Eraldo","Erardo","Erasmo","Erberto","Ercolano","Ercole","Erenia","Eriberto","Erico","Ermanno","Ermenegildo","Ermes","Ermete","Ermilo","Erminio","Ernesto","Eros","Esaù","Esuperio","Eterie","Ettore","Euclide","Eufebio","Eufemio","Eufronio","Eugenio","Eusebio","Euseo","Eustorgio","Eustosio","Eutalio","Evaldo","Evandro","Evaristo","Evasio","Everardo","Evidio","Evodio","Evremondo","Ezechiele","Ezio","Ebe","Edda","Edelberga","Editta","Edvige","Egizia","Egle","Elaide","Elda","Elena","Eleonora","Elettra","Eliana","Elide","Elimena","Elisa","Elisabetta","Elisea","Ella","Eloisa","Elsa","Elvia","Elvira","Emanuela","Emilia","Emiliana","Emma","Enimia","Enrica","Eracla","Ermelinda","Ermenegarda","Ermenegilda","Erminia","Ernesta","Ersilia","Esmeralda","Estella","Ester","Esterina","Eufemia","Eufrasia","Eugenia","Eulalia","Euridice","Eusebia","Eutalia","Eva","Evangelina","Evelina","Fabiano","Fabio","Fabrizio","Famiano","Fausto","Fazio","Fedele","Federico","Fedro","Felice","Feliciano","Ferdinando","Fermiano","Fermo","Fernando","Ferruccio","Festo","Fidenziano","Fidenzio","Filiberto","Filippo","Filomeno","Fiorenziano","Fiorenzo","Flaviano","Flavio","Fleano","Floriano","Folco","Fortunato","Fosco","Francesco","Franco","Frido","Frontiniano","Fulberto","Fulgenzio","Fulvio","Furio","Furseo","Fuscolo","Fabiana","Fabiola","Fatima","Fausta","Federica","Fedora","Felicia","Felicita","Fernanda","Fiammetta","Filippa","Filomena","Fiordaliso","Fiore","Fiorella","Fiorenza","Flaminia","Flavia","Flaviana","Flora","Floriana","Floridia","Florina","Foca","Fortunata","Fosca","Franca","Francesca","Fulvia","Gabino","Gabriele","Gaetano","Gaglioffo","Gaio","Galdino","Galeazzo","Galileo","Gallicano","Gandolfo","Garimberto","Gaspare","Gastone","Gaudenzio","Gaudino","Gautiero","Gavino","Gedeone","Geminiano","Generoso","Genesio","Gennaro","Gentile","Genziano","Gerardo","Gerasimo","Geremia","Gerino","Germano","Gerolamo","Geronimo","Geronzio","Gervasio","Gesualdo","Gherardo","Giacinto","Giacobbe","Giacomo","Giadero","Giambattista","Gianbattista","Giancarlo","Giandomenico","Gianfranco","Gianluca","Gianluigi","Gianmarco","Gianmaria","Gianmario","Gianni","Gianpaolo","Gianpiero","Gianpietro","Gianuario","Giasone","Gilberto","Gildo","Gillo","Gineto","Gino","Gioacchino","Giobbe","Gioberto","Giocondo","Gioele","Giona","Gionata","Giordano","Giorgio","Giosuè","Giosuele","Giotto","Giovanni","Giove","Gioventino","Giovenzio","Girardo","Girolamo","Giuda","Giuliano","Giulio","Giuseppe","Giustiniano","Giusto","Glauco","Goffredo","Golia","Gomberto","Gondulfo","Gonerio","Gonzaga","Gordiano","Gosto","Gottardo","Graciliano","Grato","Graziano","Gregorio","Grimaldo","Gualberto","Gualtiero","Guelfo","Guerrino","Guglielmo","Guiberto","Guido","Guiscardo","Gumesindo","Gustavo","Gabriella","Gaia","Galatea","Gaudenzia","Gelsomina","Geltrude","Gemma","Generosa","Genesia","Genoveffa","Germana","Gertrude","Ghita","Giacinta","Giada","Gigliola","Gilda","Giliola","Ginevra","Gioacchina","Gioconda","Gioia","Giorgia","Giovanna","Gisella","Giuditta","Giulia","Giuliana","Giulitta","Giuseppa","Giuseppina","Giusta","Glenda","Gloria","Godeberta","Godiva","Grazia","Graziana","Graziella","Greta","Griselda","Guenda","Guendalina","Gundelinda","Iacopo","Iacopone","Iago","Icaro","Icilio","Ido","Iginio","Igino","Ignazio","Igor","Ilario","Ildebrando","Ildefonso","Illidio","Illuminato","Immacolato","Indro","Innocente","Innocenzo","Iorio","Ippocrate","Ippolito","Ireneo","Isacco","Isaia","Ischirione","Isidoro","Ismaele","Italo","Ivan","Ivano","Ivanoe","Ivo","Ivone","Ianira","Ida","Idea","Iginia","Ilaria","Ilda","Ildegarda","Ildegonda","Ileana","Ilenia","Ilia","Ilva","Imelda","Immacolata","Incoronata","Ines","Innocenza","Iolanda","Iole","Iona","Ione","Ionne","Irene","Iride","Iris","Irma","Irmina","Isa","Isabella","Iside","Isidora","Isotta","Italia","Ivetta","Ladislao","Lamberto","Lancilotto","Landolfo","Lanfranco","Lapo","Laurentino","Lauriano","Lautone","Lavinio","Lazzaro","Leandro","Leo","Leonardo","Leone","Leonida","Leonio","Leonzio","Leopardo","Leopoldo","Letterio","Liberato","Liberatore","Liberio","Libero","Liberto","Liborio","Lidio","Lieto","Lino","Lisandro","Livino","Livio","Lodovico","Loreno","Lorenzo","Loris","Luca","Luciano","Lucio","Ludano","Ludovico","Luigi","Lara","Laura","Lavinia","Lea","Leda","Lelia","Lena","Leonia","Leonilda","Leontina","Letizia","Lia","Liana","Liberata","Liboria","Licia","Lidania","Lidia","Liliana","Linda","Lisa","Livia","Liviana","Lodovica","Loredana","Lorella","Lorena","Lorenza","Loretta","Loriana","Luana","Luce","Lucia","Luciana","Lucilla","Lucrezia","Ludovica","Luigia","Luisa","Luminosa","Luna","Macario","Maccabeo","Maffeo","Maggiorino","Magno","Maiorico","Malco","Mamante","Mancio","Manetto","Manfredo","Manilio","Manlio","Mansueto","Manuele","Marcello","Marciano","Marco","Mariano","Marino","Mario","Marolo","Martino","Marzio","Massimiliano","Massimo","Matroniano","Matteo","Mattia","Maurilio","Maurizio","Mauro","Medardo","Medoro","Melanio","Melchiade","Melchiorre","Melezio","Menardo","Menelao","Meneo","Mennone","Mercurio","Metello","Metrofane","Michelangelo","Michele","Milo","Minervino","Mirco","Mirko","Mirocleto","Misaele","Modesto","Monaldo","Monitore","Moreno","Mosè","Muziano","Macaria","Maddalena","Mafalda","Magda","Maida","Manuela","Mara","Marana","Marcella","Mareta","Margherita","Maria","Marianna","Marica","Mariella","Marilena","Marina","Marinella","Marinetta","Marisa","Marita","Marta","Martina","Maruta","Marzia","Massima","Matilde","Maura","Melania","Melissa","Melitina","Menodora","Mercede","Messalina","Mia","Michela","Milena","Mimma","Mina","Minerva","Minervina","Miranda","Mirella","Miriam","Mirta","Moira","Monica","Morena","Morgana","Namazio","Napoleone","Narciso","Narseo","Narsete","Natale","Nazario","Nazzareno","Nazzaro","Neopolo","Neoterio","Nereo","Neri","Nestore","Nicarete","Nicea","Niceforo","Niceto","Nicezio","Nico","Nicodemo","Nicola","Nicolò","Niniano","Nino","Noè","Norberto","Nostriano","Nunzio","Oddone","Oderico","Odidone","Odorico","Olimpio","Olindo","Oliviero","Omar","Omero","Onesto","Onofrio","Onorino","Onorio","Orazio","Orenzio","Oreste","Orfeo","Orio","Orlando","Oronzo","Orsino","Orso","Ortensio","Oscar","Osmondo","Osvaldo","Otello","Ottaviano","Ottavio","Ottone","Ovidio","Nadia","Natalia","Natalina","Neiva","Nerea","Nicla","Nicoletta","Nilde","Nina","Ninfa","Nives","Noemi","Norina","Norma","Novella","Nuccia","Nunziata","Odetta","Odilia","Ofelia","Olga","Olimpia","Olinda","Olivia","Oliviera","Ombretta","Ondina","Onesta","Onorata","Onorina","Orchidea","Oriana","Orietta","Ornella","Orsola","Orsolina","Ortensia","Osanna","Otilia","Ottilia","Paciano","Pacifico","Pacomio","Palatino","Palladio","Pammachio","Pancario","Pancrazio","Panfilo","Pantaleo","Pantaleone","Paolo","Pardo","Paride","Parmenio","Pasquale","Paterniano","Patrizio","Patroclo","Pauside","Peleo","Pellegrino","Pericle","Perseo","Petronio","Pierangelo","Piergiorgio","Pierluigi","Piermarco","Piero","Piersilvio","Pietro","Pio","Pippo","Placido","Platone","Plinio","Plutarco","Polidoro","Polifemo","Pollione","Pompeo","Pomponio","Ponziano","Ponzio","Porfirio","Porziano","Postumio","Prassede","Priamo","Primo","Prisco","Privato","Procopio","Prospero","Protasio","Proteo","Prudenzio","Publio","Pupolo","Pusicio","Quarto","Quasimodo","Querano","Quintiliano","Quintilio","Quintino","Quinziano","Quinzio","Quirino","Palladia","Palmazio","Palmira","Pamela","Paola","Patrizia","Pelagia","Penelope","Perla","Petronilla","Pia","Piera","Placida","Polissena","Porzia","Prisca","Priscilla","Proserpina","Prospera","Prudenzia","Quartilla","Quieta","Quiteria","Radolfo","Raffaele","Raide","Raimondo","Rainaldo","Ramiro","Raniero","Ranolfo","Reginaldo","Regolo","Remigio","Remo","Remondo","Renato","Renzo","Respicio","Ricario","Riccardo","Richelmo","Rinaldo","Rino","Robaldo","Roberto","Rocco","Rodiano","Rodolfo","Rodrigo","Rolando","Rolfo","Romano","Romeo","Romero","Romoaldo","Romolo","Romualdo","Rosario","Rubiano","Rufino","Rufo","Ruggero","Ruperto","Rutilo","Rachele","Raffaella","Rainelda","Rebecca","Regina","Renata","Riccarda","Rina","Rita","Roberta","Romana","Romilda","Romina","Romola","Rosa","Rosalia","Rosalinda","Rosamunda","Rosanna","Rosita","Rosmunda","Rossana","Rossella","Rufina","Sabato","Sabazio","Sabele","Sabino","Saffiro","Saffo","Saladino","Salomè","Salomone","Salustio","Salvatore","Salvo","Samuele","Sandro","Sansone","Sante","Santo","Sapiente","Sarbello","Saturniano","Saturnino","Saul","Saverio","Savino","Sebastiano","Secondiano","Secondo","Semplicio","Sempronio","Senesio","Senofonte","Serafino","Serapione","Sergio","Servidio","Serviliano","Sesto","Settimio","Settimo","Severiano","Severino","Severo","Sico","Sicuro","Sidonio","Sigfrido","Sigismondo","Silvano","Silverio","Silvestro","Silvio","Simeone","Simone","Sinesio","Sinfronio","Sireno","Siriano","Siricio","Sirio","Siro","Sisto","Soccorso","Socrate","Solocone","Sostene","Sosteneo","Sostrato","Spano","Spartaco","Speranzio","Stanislao","Stefano","Stiliano","Stiriaco","Surano","Sviturno","Saba","Sabina","Sabrina","Samanta","Samona","Sandra","Santina","Sara","Savina","Scolastica","Sebastiana","Seconda","Secondina","Sefora","Selene","Selvaggia","Semiramide","Serafina","Serena","Severa","Sibilla","Sidonia","Silvana","Silvia","Simona","Simonetta","Siria","Smeralda","Soave","Sofia","Sofronia","Solange","Sonia","Speranza","Stefania","Stella","Susanna","Sveva","Taddeo","Taide","Tammaro","Tancredi","Tarcisio","Tarso","Taziano","Tazio","Telchide","Telemaco","Temistocle","Teobaldo","Teodoro","Teodosio","Teodoto","Teogene","Terenzio","Terzo","Tesauro","Tesifonte","Tibaldo","Tiberio","Tiburzio","Ticone","Timoteo","Tirone","Tito","Tiziano","Tizio","Tobia","Tolomeo","Tommaso","Torquato","Tosco","Tranquillo","Tristano","Tulliano","Tullio","Turi","Turibio","Tussio","Ubaldo","Ubertino","Uberto","Ugo","Ugolino","Uguccione","Ulberto","Ulderico","Ulfo","Ulisse","Ulpiano","Ulrico","Ulstano","Ultimo","Umberto","Umile","Uranio","Urbano","Urdino","Uriele","Ursicio","Ursino","Ursmaro","Valente","Valentino","Valeriano","Valerico","Valerio","Valfredo","Valfrido","Valtena","Valter","Varo","Vasco","Vedasto","Velio","Venanzio","Venceslao","Venerando","Venerio","Ventura","Venustiano","Venusto","Verano","Verecondo","Verenzio","Verulo","Vespasiano","Vezio","Vidiano","Vidone","Vilfredo","Viliberto","Vincenzo","Vindonio","Vinebaldo","Vinfrido","Vinicio","Virgilio","Virginio","Virone","Viscardo","Vitale","Vitalico","Vito","Vittore","Vittoriano","Vittorio","Vivaldo","Viviano","Vladimiro","Vodingo","Volfango","Vulmaro","Vulpiano","Tabita","Tamara","Tarquinia","Tarsilla","Taziana","Tea","Tecla","Telica","Teodata","Teodolinda","Teodora","Teresa","Teudosia","Tina","Tiziana","Tosca","Trasea","Tullia","Ugolina","Ulfa","Uliva","Unna","Vala","Valentina","Valeria","Valeriana","Vanda","Vanessa","Vanna","Venera","Veneranda","Venere","Venusta","Vera","Verdiana","Verena","Veriana","Veridiana","Veronica","Viliana","Vilma","Vincenza","Viola","Violante","Virginia","Vissia","Vittoria","Viviana","Walter","Zabedeo","Zaccaria","Zaccheo","Zanobi","Zefiro","Zena","Zenaide","Zenebio","Zeno","Zenobio","Zenone","Zetico","Zoilo","Zosimo","Wanda","Zabina","Zaira","Zama","Zanita","Zarina","Zelinda","Zenobia","Zita","Zoe","Zosima","Abaco","Abbondanzio","Abbondio","Abdone","Abelardo","Abele","Abenzio","Abibo","Abramio","Abramo","Acacio","Acario","Accursio","Achille","Acilio","Aciscolo","Acrisio","Adalardo","Adalberto","Adalfredo","Adalgiso","Adalrico","Adamo","Addo","Adelardo","Adelberto","Adelchi","Adelfo","Adelgardo","Adelmo","Adeodato","Adolfo","Adone","Adriano","Adrione","Afro","Agabio","Agamennone","Agapito","Agazio","Agenore","Agesilao","Agostino","Agrippa","Aiace","Aidano","Aimone","Aladino","Alamanno","Alano","Alarico","Albano","Alberico","Alberto","Albino","Alboino","Albrico","Alceo","Alceste","Alcibiade","Alcide","Alcino","Aldo","Aldobrando","Aleandro","Aleardo","Aleramo","Alessandro","Alessio","Alfio","Alfonso","Alfredo","Algiso","Alighiero","Almerigo","Almiro","Aloisio","Alvaro","Alviero","Alvise","Amabile","Amadeo","Amando","Amanzio","Amaranto","Amato","Amatore","Amauri","Ambrogio","Ambrosiano","Amedeo","Amelio","Amerigo","Amico","Amilcare","Amintore","Amleto","Amone","Amore","Amos","Ampelio","Anacleto","Andrea","Angelo","Aniceto","Aniello","Annibale","Ansaldo","Anselmo","Ansovino","Antelmo","Antero","Antimo","Antino","Antioco","Antonello","Antonio","Apollinare","Apollo","Apuleio","Aquilino","Araldo","Aratone","Arcadio","Archimede","Archippo","Arcibaldo","Ardito","Arduino","Aresio","Argimiro","Argo","Arialdo","Ariberto","Ariele","Ariosto","Aris","Aristarco","Aristeo","Aristide","Aristione","Aristo","Aristofane","Aristotele","Armando","Arminio","Arnaldo","Aronne","Arrigo","Arturo","Ascanio","Asdrubale","Asimodeo","Assunto","Asterio","Astianatte","Ataleo","Atanasio","Athos","Attila","Attilano","Attilio","Auberto","Audace","Augusto","Aureliano","Aurelio","Auro","Ausilio","Averardo","Azeglio","Azelio","Abbondanza","Acilia","Ada","Adalberta","Adalgisa","Addolorata","Adelaide","Adelasia","Adele","Adelina","Adina","Adria","Adriana","Agape","Agata","Agnese","Agostina","Aida","Alba","Alberta","Albina","Alcina","Alda","Alessandra","Alessia","Alfonsa","Alfreda","Alice","Alida","Alina","Allegra","Alma","Altea","Amalia","Amanda","Amata","Ambra","Amelia","Amina","Anastasia","Anatolia","Ancilla","Andromeda","Angela","Angelica","Anita","Anna","Annabella","Annagrazia","Annamaria","Annunziata","Antea","Antigone","Antonella","Antonia","Apollina","Apollonia","Appia","Arabella","Argelia","Arianna","Armida","Artemisa","Asella","Asia","Assunta","Astrid","Atanasia","Aurelia","Aurora","Ausilia","Ausiliatrice","Ave","Aza","Azelia","Azzurra"]'
        );
      },
      195: function (i) {
        i.exports = JSON.parse(
          '["Rossi","Ferrari","Russo","Bianchi","Romano","Gallo","Costa","Fontana","Conti","Esposito","Ricci","Bruno","Rizzo","Moretti","De Luca","Marino","Greco","Barbieri","Lombardi","Giordano","Rinaldi","Colombo","Mancini","Longo","Leone","Martinelli","Marchetti","Martini","Galli","Gatti","Mariani","Ferrara","Santoro","Marini","Bianco","Conte","Serra","Farina","Gentile","Caruso","Morelli","Ferri","Testa","Ferraro","Pellegrini","Grassi","Rossetti","D\'Angelo","Bernardi","Mazza","Rizzi","Silvestri","Vitale","Franco","Parisi","Martino","Valentini","Castelli","Bellini","Monti","Lombardo","Fiore","Grasso","Ferro","Carbone","Orlando","Guerra","Palmieri","Milani","Villa","Viola","Ruggeri","De Santis","D\'Amico","Battaglia","Negri","Sala","Palumbo","Benedetti","Olivieri","Giuliani","Rosa","Amato","Molinari","Alberti","Barone","Pellegrino","Piazza","Moro","Caputo","Poli","Vitali","De Angelis","D\'Agostino","Cattaneo","Bassi","Valente","Coppola","Spinelli","Sartori","Prossimi Cento","Tweet","Precedenti","Messina","Ventura","Basile","Mantovani","Stella","Bruni","Papa","Orlandi","Neri","Leoni","Riva","Valenti","Pozzi","Volpe","Catalano","Donati","Tosi","Gagliardi","Calabrese","Venturini","Pagano","Ferretti","De Marco","Di Stefano","Costantini","Grossi","Pace","Basso","Perrone","Zanetti","Marchi","Romeo","Monaco","Maggi","Bianchini","De Rosa","Ferrante","Santini","Sacco","Villani","D\'Alessandro","Rossini","Bevilacqua","De Simone","Pagani","Giorgi","Rocca","Bonetti","Ruggiero","Mosca","Leonardi","Salerno","Grillo","Motta","Fabbri","Garofalo","Pastore","Albanese","Baldi","Biondi","Lancia","Manfredi","Sanna","Pisano","Oliva","Berti","Mancuso","Grimaldi","Marchese","Nardi","Raimondi","Massa","Filippi","Mauro","Agostini","Meloni","Gatto","Spina","Baroni","Bosco","Marra","Marinelli","Mele","Di Marco","Serafini","Piccolo","Palma","Franchi","D\'Andrea","Brunetti","Lazzari","Forte","Pugliese","Falcone","Palermo","Merlo","Fusco","Angelini","Simonetti","Pepe","Santi","Sorrentino","Rota","Montanari","Girardi","Volpi","Riccardi","Cavallo","Arena","Spada","D\'Ambrosio","Tedesco","Locatelli","Costanzo","Giannini","Lanza","Magnani","Rosati","Grandi","Piras","Napoli","Giuliano","Aiello","Mori","Sacchi","Di Benedetto","Marconi","Marchesi","Grosso","Stefani","Bernardini","Cortese","Mariotti","Martelli","Pesce","Rocco","Baldini","Mazzoni","Di Lorenzo","Ricciardi","Cavallaro","Simone","Fava","Costantino","Rosso","Moroni","Mazzola","Cirillo","Pavan","Zanella","Pinna","Rubino","Gasparini","Guidi","Franceschini","Salvi","Carta","Cavalli","Pisani","Carboni","Trevisan","Graziano","Chiesa","Di Pietro","Genovese","Re","Boni","Fiorini","Belli","Manca","Napolitano","Pinto","Cocco","Natale","Guarino","Pasquali","Vaccaro","Di Martino","Antonini","Pini","Giusti","Abate","Bucci","Andreoli","Scotti","Berardi","Landi","Casella","Giglio","Beretta","Zanini","Romagnoli","Tedeschi","Corti","Cosentino","Guida","Fortunato","Cipriani","Campana","Piva","Fazio","Leo","Novelli","Castellani","Orsini","Massaro","Diana","Croce","Brambilla","Damiani","Venturi","Bertolini","Granata","Maggio","Morandi","Lazzarini","Cavaliere","Belloni","Castagna","Nigro","Pasini","Casagrande","Ranieri","Nicoletti","Cappelli","Melis","Fiori","Porta","Franchini","Di Carlo","Rocchi","Micheli","Carrara","Longhi","Toscano","Perini","Paolini","Lorenzi","Magni","Durante","Brunelli","Romani","Bertoni","Vinci","La Rosa","Masi","Donato","Corona","Comune","Marotta","Lupo","Colella","Bosio","Mura","Valentino","Curti","Colucci","Zanotti","Mattioli","Gabrielli","Miceli","Turco","Bonelli","Negro","Zito","Filippini","Manzoni","Borghi","Albano","Ferrero","Carli","Cappelletti","Morello","Bertoli","Anselmi","Lupi","La Rocca","Marangoni","Bartoli","Massari","Mauri","Mari","Di Giovanni","Fantini","Maffei","Milano","Alessi","Pucci","Vacca","Riccio","Quaranta","Ippolito","Tonelli","Vecchi","Fumagalli","Gioia","Luciani","Festa","Tarantino","Clemente","Corsini","Graziani","Adamo","Nicolini","Furlan","Gobbi","Scala","Falco","Visconti","Gamba","Grande","Poggi","Guarnieri","Bertini","Federici","Guerrini","Gentili","Guglielmi","Abbate","Nobile","Capelli","Bono","D\'Amato","Orsi","Speranza","Barbato","Piccoli","De Marchi","Betti","Lorenzini","Albertini","Bartolini","D\'Onofrio","Del Vecchio","Gallina","Contini","Petrucci","Ronchi","Capra","Bresciani","Moretto","Poletti","Castellano","Tomasi","Grieco","Elia","Botta","Magri","Angeli","Sabatini","Torre","Visentin","Perna","Tucci","Fiorentino","Gennari","Montagna","Salvatore","Corsi","Palazzo","Izzo","Schiavone","Sasso","Musso","Campanella","Campagna","Vecchio","Casali","Ceccarelli","Fedele","Reale","Stefanelli","Bertelli","Beltrami","Alfieri","Ghezzi","Zani","Innocenti","Borrelli","Cecchini","Bonini","Manzo","Bonfanti","Spagnolo","Bettini","Zambelli","Galasso","Drago","Lai","Mattei","D\'Elia","Bruschi","Capone","Paoletti","Simoni","Viviani","Bini","Federico","Pizzi","Florio","Quaglia","Vaccari","Iorio","Bello","Galante","Di Gregorio","Corradini","De Stefano","Veronese","Callegari","Grilli","Cantoni","Giordani","Cerri","Lamberti","Valle","Giacomini","Natali","Baldo","Carletti","Damiano","Curcio","Nava","Lucchini","Di Mauro","Morini","Casale","Bossi","Savino","Amoroso","Carraro","Alfano","Grazioli","Bergamini","Gregori","Gandolfi","Marchesini","Pizzo","Facchini","Penna","Sassi","Corradi","Corso","Bergamaschi","Colonna","Di Matteo","Siciliano","Ferrario","Scarpa","Gandini","Cavallini","Merli","Sabatino","Mazzei","Cipolla","Calvi","Fabris","Arrigoni","Giacomelli","Vassallo","Cerutti","Di Giacomo","Benvenuti","Cavalieri","Zanoni","Luongo","Benetti","Righi","Liguori","Masini","Marchini","Gori","Marrone","Bove","Fioravanti","Giudici","Bongiovanni","Cappello","Cimino","Di Pasquale","Romanelli","Renzi","Carlini","Tozzi","Bonomi","Murgia","Fossati","Fanelli","Taddei","Zanin","Catania","Di Maio","Trotta","Piccinini","Manna","Palladino","Pasquini","Vincenzi","Fiorentini","Di Palma","Macri\'","Bolognesi","Zaccaria","Lepore","Botti","Sarti","Salvadori","Raimondo","Valerio","Perri","Buzzi","De Maria","De Martino","Ferraris","Zamboni","Bassani","Bonanno","Di Paola","Santangelo","Di Leo","Gualtieri","Medici","Porcu","Frigerio","Lentini","Cataldo","Colombi","Ratti","Stabile","Todaro","Buono","Zanon","Di Giorgio","Beltrame","Zanardi","Mora","Mazzeo","Maestri","Rossetto","Bellucci","Paolucci","D\'Amore","Clerici","Sandri","Salvatori","Di Girolamo","Barbera","Manzi","Sansone","Galletti","De Lucia","Mazzone","Padovani","Secchi","Gabriele","Cossu","Di Domenico","Carnevale","Capuano","Di Paolo","Cioffi","Monteleone","Adami","Savio","Pasqualini","Zucca","Tommasi","Montanaro","Bellotti","Migliorini","Foti","Cardone","Piacentini","Valli","Nicoli","Ruggieri","Molinaro","D\'Alessio","Pecoraro","Trovato","Peluso","Zago","Fioretti","Mazzocchi","Fasano","Cozzi","Veronesi","Pandolfi","Pavone","Mercuri","Persico","Bonato","Parente","Invernizzi","Boschi","Bressan","Pedretti","Tagliaferri","Perotti","Luciano","Milan","Spano","Lazzaro","Randazzo","Righetti","Proietti","Usai","Gambino","Signorini","Marin","Altieri","Galimberti","Di Francesco","Caselli","Antonucci","Bologna","Pala","Foglia","Balducci","De Vita","Pappalardo","Fabiani","Minelli","De Pasquale","Berto","Braga","Loi","Santucci","Meli","Salvati","Merlini","Ciccarelli","Valeri","Bertolotti","Perego","Manenti","Torri","Paradiso","Giunta","Petrone","Zanni","Perrotta","Bernini","Mazzini","Patti","Puglisi","Lodi","Ambrosini","Chiari","Di Bella","Marcon","Galati","Piana","Martin","Cortesi","Giacometti","Marcucci","Nobili","Zorzi","Peroni","Iannone","Crippa","Gaspari","Franceschi","Mainardi","Simeone","Cavallari","Spano\'","Conforti","Moscatelli","Martucci","Nanni","Pavesi","Vigano\'","Marano","Novello","Barletta","Morganti","Signorelli","Lucarelli","Cesari","Favaro","Evangelista","Morra","Trombetta","Morabito","Zampieri","Nocera","Schiavo","Polito","Paris","Lorusso","Belotti","Masiero","Di Santo","Anelli","Forti","Bosi","Croci","Casati","Fadda","Rubini","Marangon","Calo\'","Stefanini","Santamaria","De Francesco","Simonelli","Lisi","Chirico","Spagnuolo","Marras","Rosi","Franzoni","Mascia","Micheletti","Lenzi","Peretti","Benini","Fedeli","Sessa","Fantoni","De Paoli","Consoli","Terranova","Belfiore","Milanesi","Lo Presti","Andreotti","Tonini","Ottaviani","Santoni","Petrini","Sacchetti","Sanfilippo","Boschetti","Marzano","Tassi","Castiglioni","Guerrieri","De Felice","Urso","Barbero","Giudice","Orlandini","Cardillo","Carlucci","Tortora","Crepaldi","Pedrini","Lunardi","Montini","Paoli","Aprile","Tomaselli","Ferrarese","Danieli","Casini","Carminati","Cristiano","Bortolotti","D\'Errico","Clementi","Ricca","Cherubini","Pascale","Mercurio","Cecconi","Vanni","Roma","Tartaglia","Di Gennaro","De Vito","Doria","Guerriero","Buratti","Valsecchi","Guido","Petrillo","Giani","Campo","Lotti","Lauria","Corazza","Giorgio","Matteucci","Spagnoli","Gargiulo","Di Donato","Di Salvo","Trapani","Calcagno","Di Biase","Capasso","Barbaro","D\'Antonio","Maio","Latini","Gobbo","D\'Anna","Cardinale","Parenti","Michelini","Mangano","Delfino","Gennaro","Ballerini","Politi","Zambon","Errico","Gozzi","Ambrosi","Galbiati","Calabro\'","Vinciguerra","Ciccone","Perin","Boselli","Frattini","Casanova","Boscolo","Di Nardo","Migliore","Gargano","Marinoni","Ambrosio","Alessandrini","Chiodi","Panico","Mancino","Pegoraro","Morrone","Boldrini","Ragusa","Miele","Vella","Castiglione","Oliveri","Di Maria","Fiorillo","Canale","Maiorano","Zucchi","Maggioni","Caracciolo","Fortuna","Rotondo","Toso","Carnevali","Campi","Bacci","Savini","Ponti","Colangelo","Ciani","Cuomo","Castaldo","Dominici","D\'Urso","Mariano","Macchi","Borelli","Monticelli","Floris","Giannone","Giannetti","Mosconi","Lorenzetti","De Leo","Pelosi","Antonioli","Fabiano","Prati","Salomone","Canova","Cataldi","Bonomo","Milone","Prato","Ferreri","Cozzolino","Del Giudice","Bravi","Bona","Milazzo","Frau","Nardini","Castello","Recchia","Renna","Balsamo","Crotti","Mazzoleni","Ugolini","Gaeta","Carlino","Coletta","Capobianco","Magro","Terzi"]'
        );
      },
      488: function (i, a) {
        var o, e, n, r;
        Object.defineProperty(a, "__esModule", { value: !0 }),
          (a.Duration = a.Category = a.SlotType = a.BookingSubCollection = a.OrgSubCollection = a.Collection = void 0),
          ((a.Collection || (a.Collection = {})).Organizations =
            "organizations"),
          ((r = a.OrgSubCollection || (a.OrgSubCollection = {})).Slots =
            "slots"),
          (r.SlotsByDay = "slotsByDay"),
          (r.Customers = "customers"),
          (r.Bookings = "bookings"),
          (r.BookingsByDay = "bookingsByDay"),
          ((
            a.BookingSubCollection || (a.BookingSubCollection = {})
          ).SubscribedSlots = "subscribedSlots"),
          ((n = a.SlotType || (a.SlotType = {})).OffIceDancing =
            "off-ice-dancing"),
          (n.Ice = "ice"),
          (n.OffIceGym = "off-ice-gym"),
          ((e = a.Category || (a.Category = {})).Course = "course"),
          (e.Competitive = "competitive"),
          (e.PreCompetitive = "pre-competitive"),
          (e.Adults = "adults"),
          ((o = a.Duration || (a.Duration = {}))["1h"] = "60"),
          (o["1.5h"] = "90"),
          (o["2h"] = "120");
      },
      711: function (i, a, o) {
        var e =
            (this && this.__createBinding) ||
            (Object.create
              ? function (i, a, o, e) {
                  void 0 === e && (e = o),
                    Object.defineProperty(i, e, {
                      enumerable: !0,
                      get: function () {
                        return a[o];
                      },
                    });
                }
              : function (i, a, o, e) {
                  void 0 === e && (e = o), (i[e] = a[o]);
                }),
          n =
            (this && this.__exportStar) ||
            function (i, a) {
              for (var o in i)
                "default" === o ||
                  Object.prototype.hasOwnProperty.call(a, o) ||
                  e(a, i, o);
            };
        Object.defineProperty(a, "__esModule", { value: !0 }),
          n(o(488), a),
          n(o(355), a);
      },
      355: function (i, a, o) {
        Object.defineProperty(a, "__esModule", { value: !0 }), o(488);
      },
      54: function (i) {
        i.exports = require("firebase-admin");
      },
      576: function (i) {
        i.exports = require("firebase-functions");
      },
      804: function (i) {
        i.exports = require("lodash");
      },
      223: function (i) {
        i.exports = require("luxon");
      },
      231: function (i) {
        i.exports = require("uuid");
      },
    },
    a = {},
    o = (function o(e) {
      var n = a[e];
      if (void 0 !== n) return n.exports;
      var r = (a[e] = { exports: {} });
      return i[e].call(r.exports, r, r.exports, o), r.exports;
    })(341),
    e = exports;
  for (var n in o) e[n] = o[n];
  o.__esModule && Object.defineProperty(e, "__esModule", { value: !0 });
})();
//# sourceMappingURL=bundle.js.map
