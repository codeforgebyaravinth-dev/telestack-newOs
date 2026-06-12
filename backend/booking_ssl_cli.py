"""Provision custom booking-domain SSL from the VPS (same logic as the dealer API)."""

from __future__ import annotations

import asyncio
import sys


async def _provision_one(domain: str) -> int:
    from backend.server import _normalize_booking_domain, _provision_client_booking_domain, db

    domain = _normalize_booking_domain(domain)
    if not domain:
        print("invalid-domain\tfailed\tEnter a valid hostname", file=sys.stderr)
        return 1

    result = await _provision_client_booking_domain(domain)
    await db.clients.update_many({"custom_booking_domain": domain}, {"$set": result})

    status = str(result.get("custom_booking_domain_status") or "failed")
    err = str(result.get("custom_booking_domain_error") or "")
    print(f"{domain}\t{status}\t{err}")
    return 0 if status == "active" else 1


async def _provision_all() -> int:
    from backend.server import _normalize_booking_domain, _provision_client_booking_domain, db

    cursor = db.clients.find(
        {
            "custom_booking_domain": {"$exists": True, "$nin": ["", None]},
            "custom_booking_domain_status": {"$ne": "active"},
        },
        {"_id": 0, "custom_booking_domain": 1},
    )

    exit_code = 0
    seen: set[str] = set()
    async for client in cursor:
        domain = _normalize_booking_domain(client.get("custom_booking_domain"))
        if not domain or domain in seen:
            continue
        seen.add(domain)
        result = await _provision_client_booking_domain(domain)
        await db.clients.update_many({"custom_booking_domain": domain}, {"$set": result})
        status = str(result.get("custom_booking_domain_status") or "failed")
        err = str(result.get("custom_booking_domain_error") or "")
        print(f"{domain}\t{status}\t{err}")
        if status != "active":
            exit_code = 1
    if not seen:
        print("none\tactive\tNo pending custom domains")
    return exit_code


def _usage() -> None:
    print(
        "Usage:\n"
        "  python -m backend.booking_ssl_cli provision <domain> [domain2 ...]\n"
        "  python -m backend.booking_ssl_cli provision-all",
        file=sys.stderr,
    )


async def main(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        _usage()
        return 0
    if argv[0] == "provision-all":
        return await _provision_all()
    if argv[0] == "provision" and len(argv) >= 2:
        code = 0
        for domain in argv[1:]:
            if await _provision_one(domain) != 0:
                code = 1
        return code
    _usage()
    return 2


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(sys.argv[1:])))
