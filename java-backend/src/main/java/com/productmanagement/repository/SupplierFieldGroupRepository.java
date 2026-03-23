package com.productmanagement.repository;

import com.productmanagement.entity.SupplierFieldGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierFieldGroupRepository extends JpaRepository<SupplierFieldGroup, Integer> {
    List<SupplierFieldGroup> findAllByOrderBySortOrderAsc();
}
